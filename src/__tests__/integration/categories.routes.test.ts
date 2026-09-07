import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../../app';
import { Category } from '../../models/category.model';
import { Service } from '../../models/service.model';
import { User } from '../../models/user.model';

// ── MongoDB in-memory setup ────────────────────────────────────────────────────
//
// Integration tests exercise the real Express app (imported from src/app.ts)
// against an in-memory MongoDB. We build the model indexes explicitly so the
// case-insensitive unique index on Category behaves as it does in production.

const JWT_SECRET = 'test-secret-for-integration-tests';

let mongod: MongoMemoryServer;
let adminToken: string;
let adminId: string;

/** Sign a JWT mirroring AuthService.login ({ id, role }). */
function signToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: 60 * 60 });
}

/** Convenience: authorization header for the seeded admin. */
function authHeader(token: string = adminToken): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  await Category.init();
  await Category.createIndexes();
  await Service.init();
  await Service.createIndexes();
  await User.init();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  // Seed a single admin user and mint a token for the protected endpoints.
  const admin = await User.create({
    name: 'Admin',
    lastName: 'User',
    email: 'admin@vaultra.test',
    password: 'irrelevant-hash',
    role: 'admin',
  });
  adminId = String(admin._id);
  adminToken = signToken({ id: adminId, role: 'admin' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// ── GET /api/categories (public listing, alphabetical order) ────────────────────

describe('GET /api/categories', () => {
  it('devuelve la lista pública ordenada alfabéticamente (case-insensitive)', async () => {
    // Insert out of order and with mixed casing to exercise the collation.
    await Category.create({ name: 'zebra' });
    await Category.create({ name: 'Alpha' });
    await Category.create({ name: 'beta' });

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const names = res.body.map((c: { name: string }) => c.name);
    expect(names).toEqual(['Alpha', 'beta', 'zebra']);
  });

  it('devuelve un arreglo vacío cuando no hay categorías', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ── POST /api/categories (create, auth, uniqueness) ─────────────────────────────

describe('POST /api/categories', () => {
  it('crea una categoría con JWT admin válido y responde 201', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set(...authHeader())
      .send({ name: 'Cloud' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Cloud');
    expect(res.body._id).toBeDefined();

    const persisted = await Category.countDocuments();
    expect(persisted).toBe(1);
  });

  it('rechaza la creación sin token con 401', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Cloud' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(401);
    expect(typeof res.body.message).toBe('string');
    expect(await Category.countDocuments()).toBe(0);
  });

  it('rechaza la creación con token de rol distinto a admin con 403', async () => {
    const nonAdminToken = signToken({ id: adminId, role: 'user' });
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${nonAdminToken}`)
      .send({ name: 'Cloud' });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe(403);
  });

  it('rechaza nombres duplicados (case-insensitive) con 409', async () => {
    await request(app)
      .post('/api/categories')
      .set(...authHeader())
      .send({ name: 'Cloud' });

    const dup = await request(app)
      .post('/api/categories')
      .set(...authHeader())
      .send({ name: 'cloud' });

    expect(dup.status).toBe(409);
    expect(dup.body.status).toBe(409);
    expect(await Category.countDocuments()).toBe(1);
  });

  it('rechaza un nombre inválido (vacío) con 400 y lista el campo afectado', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set(...authHeader())
      .send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.some((e: { field: string }) => e.field === 'name')).toBe(true);
  });
});

// ── PUT /api/categories/:id (update, auth, uniqueness, not found) ───────────────

describe('PUT /api/categories/:id', () => {
  it('actualiza el nombre de una categoría existente con 200', async () => {
    const category = await Category.create({ name: 'Cloud' });

    const res = await request(app)
      .put(`/api/categories/${category._id}`)
      .set(...authHeader())
      .send({ name: 'Cloud Computing' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Cloud Computing');
  });

  it('responde 404 si la categoría no existe', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/categories/${missingId}`)
      .set(...authHeader())
      .send({ name: 'Nueva' });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe(404);
  });

  it('responde 409 al renombrar a un nombre ya en uso (case-insensitive)', async () => {
    await Category.create({ name: 'Cloud' });
    const other = await Category.create({ name: 'Security' });

    const res = await request(app)
      .put(`/api/categories/${other._id}`)
      .set(...authHeader())
      .send({ name: 'cloud' });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe(409);
  });

  it('rechaza la actualización sin token con 401', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const res = await request(app)
      .put(`/api/categories/${category._id}`)
      .send({ name: 'Cloud Computing' });

    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/categories/:id (auth, associated services, not found) ───────────

describe('DELETE /api/categories/:id', () => {
  it('elimina una categoría sin servicios asociados con 204', async () => {
    const category = await Category.create({ name: 'Cloud' });

    const res = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set(...authHeader());

    expect(res.status).toBe(204);
    expect(await Category.countDocuments()).toBe(0);
  });

  it('responde 409 si la categoría tiene servicios asociados y no la elimina', async () => {
    const category = await Category.create({ name: 'Cloud' });
    await Service.create({
      name: 'Migración a la nube',
      category: category._id,
      description: 'Servicio de migración',
      images: ['https://example.com/img.png'],
      availabilityStatus: 'active',
    });

    const res = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set(...authHeader());

    expect(res.status).toBe(409);
    expect(res.body.status).toBe(409);
    expect(await Category.countDocuments()).toBe(1);
  });

  it('responde 404 si la categoría no existe', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/categories/${missingId}`)
      .set(...authHeader());

    expect(res.status).toBe(404);
  });

  it('rechaza la eliminación sin token con 401', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const res = await request(app).delete(`/api/categories/${category._id}`);
    expect(res.status).toBe(401);
    expect(await Category.countDocuments()).toBe(1);
  });
});
