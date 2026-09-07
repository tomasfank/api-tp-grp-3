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
// Integration tests exercise the real Express app against an in-memory MongoDB.
// The Service `$text` search index is built explicitly so case-insensitive
// search over name/description works as it does in production.

const JWT_SECRET = 'test-secret-for-integration-tests';

let mongod: MongoMemoryServer;
let adminToken: string;
let adminId: string;

function signToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: 60 * 60 });
}

function authHeader(token: string = adminToken): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}

/** Build a valid CreateServiceDto body for a given category id. */
function serviceBody(
  categoryId: string,
  overrides: Partial<{
    name: string;
    description: string;
    images: string[];
    availabilityStatus: 'active' | 'inactive';
    price: number;
  }> = {}
) {
  return {
    name: overrides.name ?? 'Servicio Base',
    category: categoryId,
    description: overrides.description ?? 'Descripción del servicio',
    images: overrides.images ?? ['https://example.com/img.png'],
    availabilityStatus: overrides.availabilityStatus ?? 'active',
    ...(overrides.price !== undefined ? { price: overrides.price } : {}),
  };
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

// ── POST /api/services (create, auth, category validation) ──────────────────────

describe('POST /api/services', () => {
  it('crea un servicio con JWT admin válido y responde 201', async () => {
    const category = await Category.create({ name: 'Cloud' });

    const res = await request(app)
      .post('/api/services')
      .set(...authHeader())
      .send(serviceBody(category._id.toString(), { name: 'Migración', price: 100 }));

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Migración');
    expect(res.body.availabilityStatus).toBe('active');
    expect(res.body._id).toBeDefined();
    expect(await Service.countDocuments()).toBe(1);
  });

  it('rechaza la creación sin token con 401', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const res = await request(app)
      .post('/api/services')
      .send(serviceBody(category._id.toString()));

    expect(res.status).toBe(401);
    expect(await Service.countDocuments()).toBe(0);
  });

  it('rechaza la creación con rol distinto a admin con 403', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const nonAdmin = signToken({ id: adminId, role: 'user' });
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${nonAdmin}`)
      .send(serviceBody(category._id.toString()));

    expect(res.status).toBe(403);
  });

  it('responde 409 si la categoría referenciada no existe', async () => {
    const missingCategory = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/services')
      .set(...authHeader())
      .send(serviceBody(missingCategory));

    expect(res.status).toBe(409);
    expect(res.body.status).toBe(409);
  });

  it('rechaza un cuerpo inválido (sin imágenes) con 400 listando el campo', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const res = await request(app)
      .post('/api/services')
      .set(...authHeader())
      .send({ ...serviceBody(category._id.toString()), images: [] });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e: { field: string }) => e.field === 'images')).toBe(true);
  });
});

// ── PUT /api/services/:id (partial update, auth, not found) ─────────────────────

describe('PUT /api/services/:id', () => {
  it('actualiza solo los campos provistos con 200', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const created = await Service.create(serviceBody(category._id.toString(), { name: 'Original' }));

    const res = await request(app)
      .put(`/api/services/${created._id}`)
      .set(...authHeader())
      .send({ name: 'Actualizado' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Actualizado');
    expect(res.body.description).toBe('Descripción del servicio');
  });

  it('responde 404 si el servicio no existe', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/services/${missingId}`)
      .set(...authHeader())
      .send({ name: 'Nuevo' });

    expect(res.status).toBe(404);
  });

  it('rechaza la actualización sin token con 401', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const created = await Service.create(serviceBody(category._id.toString()));
    const res = await request(app)
      .put(`/api/services/${created._id}`)
      .send({ name: 'Nuevo' });

    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/services/:id (auth, not found) ──────────────────────────────────

describe('DELETE /api/services/:id', () => {
  it('elimina un servicio existente con 204', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const created = await Service.create(serviceBody(category._id.toString()));

    const res = await request(app)
      .delete(`/api/services/${created._id}`)
      .set(...authHeader());

    expect(res.status).toBe(204);
    expect(await Service.countDocuments()).toBe(0);
  });

  it('responde 404 si el servicio no existe', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/services/${missingId}`)
      .set(...authHeader());

    expect(res.status).toBe(404);
  });

  it('rechaza la eliminación sin token con 401', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const created = await Service.create(serviceBody(category._id.toString()));
    const res = await request(app).delete(`/api/services/${created._id}`);

    expect(res.status).toBe(401);
    expect(await Service.countDocuments()).toBe(1);
  });
});

// ── PATCH /api/services/:id/status (change status, auth, not found) ─────────────

describe('PATCH /api/services/:id/status', () => {
  it('cambia el estado de un servicio con 200', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const created = await Service.create(serviceBody(category._id.toString()));

    const res = await request(app)
      .patch(`/api/services/${created._id}/status`)
      .set(...authHeader())
      .send({ availabilityStatus: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.availabilityStatus).toBe('inactive');
  });

  it('responde 404 si el servicio no existe', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/services/${missingId}/status`)
      .set(...authHeader())
      .send({ availabilityStatus: 'inactive' });

    expect(res.status).toBe(404);
  });

  it('rechaza un estado inválido con 400', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const created = await Service.create(serviceBody(category._id.toString()));
    const res = await request(app)
      .patch(`/api/services/${created._id}/status`)
      .set(...authHeader())
      .send({ availabilityStatus: 'paused' });

    expect(res.status).toBe(400);
  });

  it('rechaza el cambio de estado sin token con 401', async () => {
    const category = await Category.create({ name: 'Cloud' });
    const created = await Service.create(serviceBody(category._id.toString()));
    const res = await request(app)
      .patch(`/api/services/${created._id}/status`)
      .send({ availabilityStatus: 'inactive' });

    expect(res.status).toBe(401);
  });
});

// ── GET /api/services (public catalog: active-only, order, filters, search) ─────

describe('GET /api/services — catálogo público', () => {
  it('devuelve solo servicios active, ordenados por nombre, con metadatos de paginación', async () => {
    const cat = await Category.create({ name: 'Cloud' });
    await Service.create(serviceBody(cat._id.toString(), { name: 'Zebra' }));
    await Service.create(serviceBody(cat._id.toString(), { name: 'Alpha' }));
    await Service.create(
      serviceBody(cat._id.toString(), { name: 'Oculto', availabilityStatus: 'inactive' })
    );

    const res = await request(app).get('/api/services');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 2, page: 1, limit: 10, totalPages: 1 });
    const names = res.body.data.map((s: { name: string }) => s.name);
    expect(names).toEqual(['Alpha', 'Zebra']);
  });

  it('los servicios inactivos no son visibles en el catálogo', async () => {
    const cat = await Category.create({ name: 'Cloud' });
    await Service.create(
      serviceBody(cat._id.toString(), { name: 'Inactivo', availabilityStatus: 'inactive' })
    );

    const res = await request(app).get('/api/services');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.data).toEqual([]);
  });

  it('pagina correctamente (page/limit) sin superponer resultados', async () => {
    const cat = await Category.create({ name: 'Cloud' });
    // Names: Servicio 01 .. Servicio 05 (zero-padded so alphabetical == numeric)
    for (let i = 1; i <= 5; i++) {
      await Service.create(
        serviceBody(cat._id.toString(), { name: `Servicio ${String(i).padStart(2, '0')}` })
      );
    }

    const page1 = await request(app).get('/api/services?page=1&limit=2');
    const page2 = await request(app).get('/api/services?page=2&limit=2');
    const page3 = await request(app).get('/api/services?page=3&limit=2');

    expect(page1.body).toMatchObject({ total: 5, page: 1, limit: 2, totalPages: 3 });
    expect(page1.body.data.map((s: { name: string }) => s.name)).toEqual([
      'Servicio 01',
      'Servicio 02',
    ]);
    expect(page2.body.data.map((s: { name: string }) => s.name)).toEqual([
      'Servicio 03',
      'Servicio 04',
    ]);
    expect(page3.body.data.map((s: { name: string }) => s.name)).toEqual(['Servicio 05']);
  });

  it('filtra por categoría devolviendo solo servicios de esa categoría', async () => {
    const catA = await Category.create({ name: 'Cloud' });
    const catB = await Category.create({ name: 'Security' });
    await Service.create(serviceBody(catA._id.toString(), { name: 'Servicio A' }));
    await Service.create(serviceBody(catB._id.toString(), { name: 'Servicio B' }));

    const res = await request(app).get(`/api/services?category=${catA._id}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].name).toBe('Servicio A');
  });

  it('responde 404 al filtrar por una categoría inexistente', async () => {
    const missingCategory = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/services?category=${missingCategory}`);
    expect(res.status).toBe(404);
  });

  it('busca de forma case-insensitive en name y description', async () => {
    const cat = await Category.create({ name: 'Cloud' });
    await Service.create(
      serviceBody(cat._id.toString(), {
        name: 'Migración Kubernetes',
        description: 'Orquestación de contenedores',
      })
    );
    await Service.create(
      serviceBody(cat._id.toString(), {
        name: 'Backup diario',
        description: 'Respaldo en la nube con Kubernetes gestionado',
      })
    );
    await Service.create(
      serviceBody(cat._id.toString(), {
        name: 'Firewall',
        description: 'Protección perimetral',
      })
    );

    // Lowercase term must match the differently-cased word in both fields.
    const res = await request(app).get('/api/services?search=kubernetes');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    const names = res.body.data.map((s: { name: string }) => s.name).sort();
    expect(names).toEqual(['Backup diario', 'Migración Kubernetes']);
  });

  it('rechaza parámetros de query inválidos (page=0) con 400', async () => {
    const res = await request(app).get('/api/services?page=0');
    expect(res.status).toBe(400);
    expect(res.body.status).toBe(400);
  });
});

// ── GET /api/services/:id (public detail: 404 for inactive/nonexistent) ─────────

describe('GET /api/services/:id — detalle público', () => {
  it('devuelve un servicio active por id con 200', async () => {
    const cat = await Category.create({ name: 'Cloud' });
    const created = await Service.create(serviceBody(cat._id.toString(), { name: 'Detalle' }));

    const res = await request(app).get(`/api/services/${created._id}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Detalle');
    expect(res.body._id).toBe(String(created._id));
  });

  it('responde 404 para un servicio inactive', async () => {
    const cat = await Category.create({ name: 'Cloud' });
    const created = await Service.create(
      serviceBody(cat._id.toString(), { availabilityStatus: 'inactive' })
    );

    const res = await request(app).get(`/api/services/${created._id}`);
    expect(res.status).toBe(404);
    expect(res.body.status).toBe(404);
  });

  it('responde 404 para un id inexistente', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/services/${missingId}`);
    expect(res.status).toBe(404);
  });
});
