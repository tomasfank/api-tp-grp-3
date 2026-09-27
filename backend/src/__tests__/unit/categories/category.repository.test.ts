import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { CategoryRepository } from '../../../repositories/category.repository';
import { Category } from '../../../models/category.model';
import { Service } from '../../../models/service.model';
import { ConflictError } from '../../../errors';

// ── MongoDB in-memory setup ────────────────────────────────────────────────────

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // The Category model relies on a unique index with a case-insensitive
  // collation. Ensure the in-memory Mongo actually builds those indexes before
  // the property tests run, otherwise duplicate-name detection would silently
  // fall back to application-level checks only.
  await Category.init();
  await Category.createIndexes();
  await Category.syncIndexes();
  await Service.init();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generates a non-empty category name that is:
 *  - trimmed non-empty (contains at least one non-whitespace character),
 *  - between 1 and 100 characters after trimming,
 *  - free of control characters.
 * The value is returned already trimmed so it matches what Mongoose stores
 * (the Category model declares `trim: true`).
 */
const NAME_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split('');

const categoryNameArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...NAME_CHARS), { minLength: 1, maxLength: 100 })
  .map((chars) => chars.join('').trim())
  .filter((s) => s.length >= 1 && s.length <= 100);

/**
 * Two distinct (case-insensitively different) names. Useful to build sets of
 * categories that will not collide on the unique index.
 */
const distinctNamesArb = (count: number): fc.Arbitrary<string[]> =>
  fc
    .uniqueArray(categoryNameArb, {
      minLength: count,
      maxLength: count,
      selector: (s) => s.toLowerCase(),
    });

/** Builds a valid Service document referencing the given category id. */
async function createServiceForCategory(categoryId: mongoose.Types.ObjectId, name: string) {
  return Service.create({
    name: name.slice(0, 100) || 'Servicio',
    category: categoryId,
    description: 'Descripción de prueba para el servicio asociado',
    images: ['https://example.com/img-1.png'],
    availabilityStatus: 'active',
  });
}

// ── Property 12: Las categorías con servicios asociados no pueden eliminarse ──

// Feature: vaultra-consulting-backend, Property 12: Las categorías con servicios asociados no pueden eliminarse
describe('Property 12 — Las categorías con servicios asociados no pueden eliminarse', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 12: Las categorías con servicios asociados no pueden eliminarse
    'delete() lanza ConflictError y no elimina ni la categoría ni los servicios asociados',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          categoryNameArb,
          fc.integer({ min: 1, max: 4 }),
          async (categoryName, serviceCount) => {
            await Service.deleteMany({});
            await Category.deleteMany({});

            const category = await CategoryRepository.create({ name: categoryName });
            const categoryId = (category._id as mongoose.Types.ObjectId);

            // Create at least one associated service.
            for (let i = 0; i < serviceCount; i++) {
              await createServiceForCategory(categoryId, `${categoryName}-svc-${i}`);
            }

            // Deletion must be rejected with ConflictError.
            await expect(
              CategoryRepository.delete(String(categoryId))
            ).rejects.toBeInstanceOf(ConflictError);

            // The category must still exist.
            const stillThere = await Category.findById(categoryId);
            expect(stillThere).not.toBeNull();

            // All services must still exist.
            const remainingServices = await Service.countDocuments({ category: categoryId });
            expect(remainingServices).toBe(serviceCount);
          }
        ),
        { numRuns: 100 }
      );
    },
    120000
  );
});

// ── Property 13: La unicidad del nombre de categoría se respeta en creación y actualización ──

// Feature: vaultra-consulting-backend, Property 13: La unicidad del nombre de categoría se respeta en creación y actualización
describe('Property 13 — La unicidad del nombre de categoría se respeta en creación y actualización', () => {
  /** Randomly flips the case of each character to produce a case-variant. */
  const toCaseVariant = (s: string): string =>
    s
      .split('')
      .map((ch) =>
        Math.random() < 0.5 ? ch.toUpperCase() : ch.toLowerCase()
      )
      .join('');

  it(
    // Feature: vaultra-consulting-backend, Property 13: La unicidad del nombre de categoría se respeta en creación y actualización
    'create() con un nombre duplicado (case-insensitive) lanza ConflictError',
    async () => {
      await fc.assert(
        fc.asyncProperty(categoryNameArb, async (name) => {
          await Service.deleteMany({});
          await Category.deleteMany({});

          await CategoryRepository.create({ name });

          const variant = toCaseVariant(name);
          await expect(
            CategoryRepository.create({ name: variant })
          ).rejects.toBeInstanceOf(ConflictError);

          // Only a single category must exist.
          const count = await Category.countDocuments({});
          expect(count).toBe(1);
        }),
        { numRuns: 100 }
      );
    },
    120000
  );

  it(
    // Feature: vaultra-consulting-backend, Property 13: La unicidad del nombre de categoría se respeta en creación y actualización
    'update() de una categoría con el nombre de otra (case-insensitive) lanza ConflictError',
    async () => {
      await fc.assert(
        fc.asyncProperty(distinctNamesArb(2), async ([nameA, nameB]) => {
          await Service.deleteMany({});
          await Category.deleteMany({});

          await CategoryRepository.create({ name: nameA });
          const catB = await CategoryRepository.create({ name: nameB });

          // Attempt to rename catB to a case-variant of nameA → conflict.
          const variantOfA = toCaseVariant(nameA);
          await expect(
            CategoryRepository.update(String(catB._id), { name: variantOfA })
          ).rejects.toBeInstanceOf(ConflictError);

          // catB must keep its original name.
          const catBAfter = await Category.findById(catB._id);
          expect(catBAfter).not.toBeNull();
          expect(catBAfter!.name).toBe(nameB);
        }),
        { numRuns: 100 }
      );
    },
    120000
  );
});

// ── Property 14: El listado de categorías siempre está ordenado alfabéticamente ──

// Feature: vaultra-consulting-backend, Property 14: El listado de categorías siempre está ordenado alfabéticamente
describe('Property 14 — El listado de categorías siempre está ordenado alfabéticamente', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 14: El listado de categorías siempre está ordenado alfabéticamente
    'findAll() devuelve las categorías ordenadas alfabéticamente por nombre (case-insensitive)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 8 }).chain((n) => distinctNamesArb(n)),
          async (names) => {
            await Service.deleteMany({});
            await Category.deleteMany({});

            for (const name of names) {
              await CategoryRepository.create({ name });
            }

            const result = await CategoryRepository.findAll();
            expect(result).toHaveLength(names.length);

            const returnedNames = result.map((c) => c.name);
            const expectedOrder = [...returnedNames].sort((a, b) =>
              a.toLowerCase() < b.toLowerCase()
                ? -1
                : a.toLowerCase() > b.toLowerCase()
                  ? 1
                  : 0
            );

            expect(returnedNames).toEqual(expectedOrder);

            // Verify each adjacent pair is non-descending (case-insensitive).
            for (let i = 1; i < returnedNames.length; i++) {
              expect(
                returnedNames[i - 1].toLowerCase() <= returnedNames[i].toLowerCase()
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    },
    120000
  );
});
