import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../../app';
import { User } from '../../models/user.model';

// ── MongoDB in-memory setup ────────────────────────────────────────────────────
//
// Integration tests exercise the full Express stack (routes → middlewares →
// controllers → services → models) via Supertest, backed by an in-memory
// MongoDB. No external services are required. JWT_SECRET is provided in-process
// so the auth middleware and service can sign/verify tokens.

let mongod: MongoMemoryServer;

const VALID_ADMIN = {
  name: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@vaultra.dev',
  password: 'Password1',
  phone: '1123456789',
};

beforeAll(async () => {
  process.env.JWT_SECRET = 'integration-test-secret';
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Build the unique email index so duplicate-email conflicts are detected.
  await User.init();
  await User.createIndexes();
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

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Register the default admin and return the response. */
async function registerDefault() {
  return request(app).post('/api/auth/register').send(VALID_ADMIN);
}

/** Register (if needed) and log in the default admin, returning the JWT. */
async function loginDefault(): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: VALID_ADMIN.email, password: VALID_ADMIN.password });
  return res.body.token as string;
}

// ── Full authenticated flow (Requirements 2.1, 2.5, 2.7) ──────────────────────

describe('Flujo completo de autenticación', () => {
  it('register → login → request autenticado → logout → request rechazado', async () => {
    // 1. Register (Requirement 2.1)
    const registerRes = await registerDefault();
    expect(registerRes.status).toBe(201);
    expect(registerRes.body).toMatchObject({
      name: VALID_ADMIN.name,
      lastName: VALID_ADMIN.lastName,
      email: VALID_ADMIN.email,
      role: 'admin',
    });
    // Password must never be exposed (Requirement 2.1/2.12)
    expect(registerRes.body.password).toBeUndefined();

    // 2. Login (Requirement 2.5)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_ADMIN.email, password: VALID_ADMIN.password });
    expect(loginRes.status).toBe(200);
    expect(typeof loginRes.body.token).toBe('string');
    const token = loginRes.body.token as string;

    // 3. Authenticated request succeeds (logout requires a valid token)
    const authedRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(authedRes.status).toBe(200);
    expect(authedRes.body).toEqual({ message: 'Sesión cerrada exitosamente' });

    // 4. Once logged out, the same token is rejected (Requirement 2.7)
    const rejectedRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(rejectedRes.status).toBe(401);
    expect(rejectedRes.body).toMatchObject({
      status: 401,
      message: expect.any(String),
    });
  });
});

// ── Registration errors (Requirements 2.2, 2.3, 2.4) ──────────────────────────

describe('POST /api/auth/register — errores', () => {
  it('rechaza email duplicado con 409 y formato de error estándar', async () => {
    await registerDefault();

    const dupRes = await registerDefault();
    expect(dupRes.status).toBe(409);
    expect(dupRes.body).toEqual({
      status: 409,
      message: expect.any(String),
    });
  });

  it('rechaza payload inválido con 400 y lista los campos afectados', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: '',
      lastName: '',
      email: 'not-an-email',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe(400);
    expect(typeof res.body.message).toBe('string');
    expect(Array.isArray(res.body.errors)).toBe(true);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(
      expect.arrayContaining(['name', 'lastName', 'email', 'password'])
    );
  });
});

// ── Login errors (Requirements 2.6) ───────────────────────────────────────────

describe('POST /api/auth/login — errores', () => {
  it('rechaza credenciales incorrectas con error genérico 401', async () => {
    await registerDefault();

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_ADMIN.email, password: 'WrongPass1' });
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body).toEqual({
      status: 401,
      message: expect.any(String),
    });

    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@vaultra.dev', password: 'Password1' });
    expect(unknownEmail.status).toBe(401);

    // The message must be identical regardless of which field is wrong
    // (generic error — no user enumeration).
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it('rechaza payload inválido con 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: '' });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

// ── Forgot / reset password round-trip (Requirements 2.8, 2.9, 2.10, 2.11) ─────

describe('Recuperación de contraseña (forgot → reset round-trip)', () => {
  it('permite restablecer la contraseña y usarla en un nuevo login', async () => {
    await registerDefault();

    // Request a reset token.
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: VALID_ADMIN.email });
    expect(forgotRes.status).toBe(200);
    expect(typeof forgotRes.body.resetToken).toBe('string');
    const resetToken = forgotRes.body.resetToken as string;

    // Reset to a new password.
    const newPassword = 'NewPassword2';
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ resetToken, newPassword });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body).toEqual({
      message: 'Contraseña restablecida exitosamente',
    });

    // Old password no longer works.
    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_ADMIN.email, password: VALID_ADMIN.password });
    expect(oldLogin.status).toBe(401);

    // New password works.
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_ADMIN.email, password: newPassword });
    expect(newLogin.status).toBe(200);
    expect(typeof newLogin.body.token).toBe('string');
  });

  it('responde 200 sin revelar existencia del email para un email desconocido', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@vaultra.dev' });
    expect(res.status).toBe(200);
    expect(typeof res.body.resetToken).toBe('string');
  });

  it('rechaza un reset token inválido o expirado con 401', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ resetToken: 'non-existent-token', newPassword: 'AnotherPass3' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      status: 401,
      message: expect.any(String),
    });
  });
});

// ── Update profile (Requirements 3.1, 3.2, 3.3) ───────────────────────────────

describe('PUT /api/auth/profile — [auth, admin]', () => {
  it('actualiza sólo los campos provistos para un admin autenticado', async () => {
    await registerDefault();
    const token = await loginDefault();

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Grace' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Grace',
      lastName: VALID_ADMIN.lastName, // unchanged
      email: VALID_ADMIN.email,
    });
    expect(res.body.password).toBeUndefined();
  });

  it('rechaza el request sin token con 401', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .send({ name: 'Grace' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      status: 401,
      message: expect.any(String),
    });
  });

  it('rechaza un token inválido con 401', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ name: 'Grace' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(401);
  });

  it('rechaza un payload sin campos con 400', async () => {
    await registerDefault();
    const token = await loginDefault();

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe(400);
  });
});

// ── Error format on unsupported media (Requirement 10.x cross-check) ──────────

describe('Formato de error — contenido no JSON', () => {
  it('rechaza POST con content-type no JSON con 415 y formato estándar', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'text/plain')
      .send('email=ada@vaultra.dev');

    expect(res.status).toBe(415);
    expect(res.body).toMatchObject({
      status: 415,
      message: expect.any(String),
    });
  });
});
