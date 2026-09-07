import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { seedDatabase } from '../../seed/seeder';
import { Category } from '../../models/category.model';
import { Service } from '../../models/service.model';
import { BusinessInfo } from '../../models/business-info.model';

// ── MongoDB in-memory setup ────────────────────────────────────────────────────
//
// The seeder assumes an active Mongoose connection and never opens one itself
// (its standalone runner is guarded by `require.main === module`). We provide an
// in-memory MongoDB following the same connect/disconnect pattern used across
// the repository unit tests.

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Build the Category unique (case-insensitive) index so the seeder's
  // idempotency does not silently rely on collection emptiness alone.
  await Category.init();
  await Category.createIndexes();
  await Category.syncIndexes();
  await Service.init();
  await BusinessInfo.init();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// ── Minimum counts (Requirements 12.1, 12.2, 12.3) ──────────────────────────────

describe('seedDatabase — conteos mínimos', () => {
  it('inserta al menos 4 categorías, 20 servicios y 1 BusinessInfo', async () => {
    const result = await seedDatabase();

    // The reported inserts must satisfy the documented minimums.
    expect(result.categoriesInserted).toBeGreaterThanOrEqual(4);
    expect(result.servicesInserted).toBeGreaterThanOrEqual(20);
    expect(result.businessInfoInserted).toBeGreaterThanOrEqual(1);

    // The persisted documents must satisfy the same minimums.
    const categoryCount = await Category.countDocuments();
    const serviceCount = await Service.countDocuments();
    const businessInfoCount = await BusinessInfo.countDocuments();

    expect(categoryCount).toBeGreaterThanOrEqual(4);
    expect(serviceCount).toBeGreaterThanOrEqual(20);
    expect(businessInfoCount).toBeGreaterThanOrEqual(1);
  });

  it('cada servicio insertado referencia una categoría real, tiene al menos una imagen y estado active', async () => {
    await seedDatabase();

    const services = await Service.find();
    expect(services.length).toBeGreaterThanOrEqual(20);

    const categoryIds = new Set(
      (await Category.find()).map((c) => String(c._id))
    );

    for (const service of services) {
      expect(categoryIds.has(String(service.category))).toBe(true);
      expect(service.images.length).toBeGreaterThanOrEqual(1);
      expect(service.availabilityStatus).toBe('active');
    }
  });
});

// ── Idempotency (Requirements 12.4, 12.5) ──────────────────────────────────────

describe('seedDatabase — comportamiento idempotente', () => {
  it('ejecutar el seeder dos veces no genera duplicados', async () => {
    // First run seeds everything.
    const firstRun = await seedDatabase();
    expect(firstRun.categoriesInserted).toBeGreaterThanOrEqual(4);
    expect(firstRun.servicesInserted).toBeGreaterThanOrEqual(20);
    expect(firstRun.businessInfoInserted).toBeGreaterThanOrEqual(1);

    const categoriesAfterFirst = await Category.countDocuments();
    const servicesAfterFirst = await Service.countDocuments();
    const businessInfoAfterFirst = await BusinessInfo.countDocuments();

    // Second run must be a no-op: nothing new inserted.
    const secondRun = await seedDatabase();
    expect(secondRun.categoriesInserted).toBe(0);
    expect(secondRun.servicesInserted).toBe(0);
    expect(secondRun.businessInfoInserted).toBe(0);

    // Counts must remain unchanged after the second run.
    expect(await Category.countDocuments()).toBe(categoriesAfterFirst);
    expect(await Service.countDocuments()).toBe(servicesAfterFirst);
    expect(await BusinessInfo.countDocuments()).toBe(businessInfoAfterFirst);
  });
});
