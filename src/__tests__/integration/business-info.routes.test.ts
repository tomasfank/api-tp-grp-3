import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../../app';
import { BusinessInfo } from '../../models/business-info.model';

// ── Test setup ──────────────────────────────────────────────────────────────
//
// Integration tests for the business-info routes (Requirements 4.1-4.6).
// Uses Supertest against the exported Express app and an in-memory MongoDB.
// Protected routes require a valid admin JWT signed with JWT_SECRET, matching
// the { id, role } claim shape emitted by AuthService.login and expected by
// authMiddleware.

let mongod: MongoMemoryServer;

const JWT_SECRET = 'integration-test-secret';

function makeToken(claims: Record<string, unknown>): string {
  return jwt.sign(claims, JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = () =>
  makeToken({ id: new mongoose.Types.ObjectId().toString(), role: 'admin' });

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
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

// ── GET /api/business-info (public) ───────────────────────────────────────────

describe('GET /api/business-info', () => {
  it('devuelve 404 cuando la información del negocio no está configurada', async () => {
    const res = await request(app).get('/api/business-info');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 404,
      message: expect.any(String),
    });
  });

  it('devuelve la información del negocio vigente sin requerir autenticación', async () => {
    await BusinessInfo.create({
      name: 'Vaultra Consulting',
      description: 'Consultoría en tecnología',
      phone: '1122334455',
    });

    const res = await request(app).get('/api/business-info');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Vaultra Consulting',
      description: 'Consultoría en tecnología',
      phone: '1122334455',
    });
  });
});

// ── PUT /api/business-info [auth, admin] ──────────────────────────────────────

describe('PUT /api/business-info', () => {
  it('rechaza el upsert sin token de autenticación (401)', async () => {
    const res = await request(app)
      .put('/api/business-info')
      .send({ name: 'Vaultra Consulting' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ status: 401, message: expect.any(String) });
  });

  it('rechaza el upsert con un token de rol no admin (403)', async () => {
    const token = makeToken({
      id: new mongoose.Types.ObjectId().toString(),
      role: 'user',
    });

    const res = await request(app)
      .put('/api/business-info')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Vaultra Consulting' });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ status: 403, message: expect.any(String) });
  });

  it('crea la información del negocio cuando no existe (upsert como admin)', async () => {
    const res = await request(app)
      .put('/api/business-info')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        name: 'Vaultra Consulting',
        description: 'Consultoría integral',
        address: 'Av. Siempre Viva 742',
        phone: '1122334455',
        socialMedia: { linkedin: 'https://linkedin.com/company/vaultra' },
        businessHours: 'Lun a Vie 9-18',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Vaultra Consulting',
      description: 'Consultoría integral',
      address: 'Av. Siempre Viva 742',
      phone: '1122334455',
      socialMedia: { linkedin: 'https://linkedin.com/company/vaultra' },
      businessHours: 'Lun a Vie 9-18',
    });

    const count = await BusinessInfo.countDocuments();
    expect(count).toBe(1);
  });

  it('actualiza solo los campos provistos y mantiene un único documento', async () => {
    await request(app)
      .put('/api/business-info')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Vaultra Consulting', description: 'Original' });

    const res = await request(app)
      .put('/api/business-info')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ description: 'Actualizada' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Vaultra Consulting',
      description: 'Actualizada',
    });

    const count = await BusinessInfo.countDocuments();
    expect(count).toBe(1);
  });

  it('rechaza el upsert sin ningún campo válido (400)', async () => {
    const res = await request(app)
      .put('/api/business-info')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400, message: expect.any(String) });
  });

  it('rechaza el upsert con un teléfono inválido (400)', async () => {
    const res = await request(app)
      .put('/api/business-info')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ phone: 'no-numerico' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400, message: expect.any(String) });
  });
});
