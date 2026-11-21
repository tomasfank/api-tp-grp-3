import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../../app';
import { Contact } from '../../models/contact.model';

// ── Test setup ──────────────────────────────────────────────────────────────
//
// Integration tests for the contact routes (Requirements 8.1-8.5, 9.1-9.6).
// Public submission via POST /api/contacts and administrative management via
// the /api/admin/contacts routes (auth + admin). Uses Supertest against the
// exported Express app and an in-memory MongoDB. Admin JWTs are signed with
// JWT_SECRET matching the { id, role } claim shape used by the auth middleware.

let mongod: MongoMemoryServer;

const JWT_SECRET = 'integration-test-secret';

function makeToken(claims: Record<string, unknown>): string {
  return jwt.sign(claims, JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = () =>
  makeToken({ id: new mongoose.Types.ObjectId().toString(), role: 'admin' });

const validContact = () => ({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '1122334455',
  subject: 'Consulta sobre servicios',
  message: 'Quisiera más información sobre sus servicios cloud.',
});

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Contact.init();
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

// ── POST /api/contacts (public submission) ────────────────────────────────────

describe('POST /api/contacts', () => {
  it('persiste la consulta con status pending y devuelve 201', async () => {
    const res = await request(app).post('/api/contacts').send(validContact());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Consulta sobre servicios',
      status: 'pending',
    });
    expect(res.body._id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();

    const stored = await Contact.findById(res.body._id);
    expect(stored?.status).toBe('pending');
  });

  it('almacena phone como null cuando no se provee', async () => {
    const { phone: _phone, ...withoutPhone } = validContact();

    const res = await request(app).post('/api/contacts').send(withoutPhone);

    expect(res.status).toBe(201);
    expect(res.body.phone).toBeNull();

    const stored = await Contact.findById(res.body._id);
    expect(stored?.phone).toBeNull();
  });

  it('rechaza consultas con email inválido (400)', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ ...validContact(), email: 'no-es-un-email' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400, message: expect.any(String) });
  });

  it('rechaza consultas con campos requeridos faltantes (400)', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({ email: 'ada@example.com' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400, message: expect.any(String) });
  });
});

// ── GET /api/admin/contacts [auth, admin] ─────────────────────────────────────

describe('GET /api/admin/contacts', () => {
  it('rechaza el listado sin autenticación (401)', async () => {
    const res = await request(app).get('/api/admin/contacts');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ status: 401, message: expect.any(String) });
  });

  it('rechaza el listado con rol no admin (403)', async () => {
    const token = makeToken({
      id: new mongoose.Types.ObjectId().toString(),
      role: 'user',
    });

    const res = await request(app)
      .get('/api/admin/contacts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ status: 403, message: expect.any(String) });
  });

  it('lista las consultas con paginación y metadatos como admin', async () => {
    // Seed 3 contacts.
    for (let i = 0; i < 3; i++) {
      await Contact.create({
        name: `Persona ${i}`,
        email: `persona${i}@example.com`,
        subject: `Asunto ${i}`,
        message: `Mensaje ${i}`,
        status: 'pending',
      });
    }

    const res = await request(app)
      .get('/api/admin/contacts')
      .query({ page: 1, pageSize: 2 })
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total: 3,
      page: 1,
      pageSize: 2,
      totalPages: 2,
    });
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('ordena las consultas por createdAt descendente (más recientes primero)', async () => {
    const older = await Contact.create({
      name: 'Antiguo',
      email: 'antiguo@example.com',
      subject: 'Viejo',
      message: 'Mensaje viejo',
      status: 'pending',
      createdAt: new Date('2020-01-01T00:00:00Z'),
    });
    const newer = await Contact.create({
      name: 'Nuevo',
      email: 'nuevo@example.com',
      subject: 'Reciente',
      message: 'Mensaje reciente',
      status: 'pending',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    });

    const res = await request(app)
      .get('/api/admin/contacts')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0]._id).toBe(String(newer._id));
    expect(res.body.data[1]._id).toBe(String(older._id));
  });
});

// ── PATCH /api/admin/contacts/:id/status [auth, admin] ─────────────────────────

describe('PATCH /api/admin/contacts/:id/status', () => {
  it('actualiza el estado de una consulta (pending -> read -> pending)', async () => {
    const contact = await Contact.create({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Consulta',
      message: 'Mensaje',
      status: 'pending',
    });

    const readRes = await request(app)
      .patch(`/api/admin/contacts/${contact._id}/status`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'read' });

    expect(readRes.status).toBe(200);
    expect(readRes.body.status).toBe('read');

    const pendingRes = await request(app)
      .patch(`/api/admin/contacts/${contact._id}/status`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'pending' });

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.status).toBe('pending');

    const stored = await Contact.findById(contact._id);
    expect(stored?.status).toBe('pending');
  });

  it('no permite marcar como answered manualmente (400)', async () => {
    const contact = await Contact.create({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Consulta',
      message: 'Mensaje',
      status: 'read',
    });

    const res = await request(app)
      .patch(`/api/admin/contacts/${contact._id}/status`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'answered' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400, message: expect.any(String) });

    const stored = await Contact.findById(contact._id);
    expect(stored?.status).toBe('read');
  });

  it('no permite cambiar el estado de una consulta ya respondida (409)', async () => {
    const contact = await Contact.create({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Consulta',
      message: 'Mensaje',
      status: 'answered',
      reply: { message: 'Gracias', answeredAt: new Date() },
    });

    const res = await request(app)
      .patch(`/api/admin/contacts/${contact._id}/status`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'pending' });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ status: 409, message: expect.any(String) });
  });

  it('rechaza un estado inválido (400)', async () => {
    const contact = await Contact.create({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Consulta',
      message: 'Mensaje',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/admin/contacts/${contact._id}/status`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'invalid-status' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400, message: expect.any(String) });
  });

  it('devuelve 404 para un id inexistente', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .patch(`/api/admin/contacts/${missingId}/status`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'read' });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ status: 404, message: expect.any(String) });
  });

  it('rechaza la actualización sin autenticación admin (401)', async () => {
    const contact = await Contact.create({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Consulta',
      message: 'Mensaje',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/admin/contacts/${contact._id}/status`)
      .send({ status: 'read' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ status: 401, message: expect.any(String) });
  });
});

// ── POST /api/admin/contacts/:id/reply [auth, admin] ──────────────────────────

describe('POST /api/admin/contacts/:id/reply', () => {
  const seedContact = (status: 'pending' | 'read' = 'pending') =>
    Contact.create({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Consulta',
      message: 'Mensaje',
      status,
    });

  it('guarda la respuesta, marca la consulta como answered y devuelve 200', async () => {
    const contact = await seedContact('read');
    const adminId = new mongoose.Types.ObjectId().toString();
    const token = makeToken({ id: adminId, role: 'admin' });

    const res = await request(app)
      .post(`/api/admin/contacts/${contact._id}/reply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '  Hola Ada, te contactamos a la brevedad.  ' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('answered');
    expect(res.body.reply).toMatchObject({
      message: 'Hola Ada, te contactamos a la brevedad.',
      answeredBy: adminId,
    });
    expect(res.body.reply.answeredAt).toBeDefined();

    const stored = await Contact.findById(contact._id);
    expect(stored?.status).toBe('answered');
    expect(stored?.reply?.message).toBe('Hola Ada, te contactamos a la brevedad.');
    expect(stored?.reply?.answeredAt).toBeInstanceOf(Date);
    expect(String(stored?.reply?.answeredBy)).toBe(adminId);
  });

  it('las consultas nuevas no tienen respuesta (reply null)', async () => {
    const res = await request(app).post('/api/contacts').send(validContact());

    expect(res.status).toBe(201);
    expect(res.body.reply).toBeNull();
  });

  it('rechaza una respuesta vacía (400) sin cambiar el estado', async () => {
    const contact = await seedContact();

    const res = await request(app)
      .post(`/api/admin/contacts/${contact._id}/reply`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ message: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400, message: expect.any(String) });

    const stored = await Contact.findById(contact._id);
    expect(stored?.status).toBe('pending');
    expect(stored?.reply).toBeNull();
  });

  it('rechaza responder una consulta ya respondida (409)', async () => {
    const contact = await seedContact();

    const first = await request(app)
      .post(`/api/admin/contacts/${contact._id}/reply`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ message: 'Primera respuesta' });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post(`/api/admin/contacts/${contact._id}/reply`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ message: 'Segunda respuesta' });

    expect(second.status).toBe(409);
    expect(second.body).toMatchObject({ status: 409, message: expect.any(String) });

    const stored = await Contact.findById(contact._id);
    expect(stored?.reply?.message).toBe('Primera respuesta');
  });

  it('devuelve 404 para un id inexistente', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/admin/contacts/${missingId}/reply`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ message: 'Hola' });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ status: 404, message: expect.any(String) });
  });

  it('rechaza la respuesta sin autenticación (401)', async () => {
    const contact = await seedContact();

    const res = await request(app)
      .post(`/api/admin/contacts/${contact._id}/reply`)
      .send({ message: 'Hola' });

    expect(res.status).toBe(401);
  });

  it('rechaza la respuesta con rol no admin (403)', async () => {
    const contact = await seedContact();
    const token = makeToken({
      id: new mongoose.Types.ObjectId().toString(),
      role: 'user',
    });

    const res = await request(app)
      .post(`/api/admin/contacts/${contact._id}/reply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hola' });

    expect(res.status).toBe(403);
  });
});

// ── DELETE /api/admin/contacts/:id [auth, admin] ──────────────────────────────

describe('DELETE /api/admin/contacts/:id', () => {
  it('elimina una consulta existente y devuelve 204', async () => {
    const contact = await Contact.create({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Consulta',
      message: 'Mensaje',
      status: 'pending',
    });

    const res = await request(app)
      .delete(`/api/admin/contacts/${contact._id}`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(204);

    const stored = await Contact.findById(contact._id);
    expect(stored).toBeNull();
  });

  it('devuelve 404 al eliminar un id inexistente', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .delete(`/api/admin/contacts/${missingId}`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ status: 404, message: expect.any(String) });
  });

  it('rechaza la eliminación con rol no admin (403)', async () => {
    const contact = await Contact.create({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Consulta',
      message: 'Mensaje',
      status: 'pending',
    });
    const token = makeToken({
      id: new mongoose.Types.ObjectId().toString(),
      role: 'user',
    });

    const res = await request(app)
      .delete(`/api/admin/contacts/${contact._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ status: 403, message: expect.any(String) });
  });
});
