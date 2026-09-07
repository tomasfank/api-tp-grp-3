import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { ServiceRepository } from '../../../repositories/service.repository';
import { Service } from '../../../models/service.model';
import { Category } from '../../../models/category.model';
import { ConflictError, NotFoundError } from '../../../errors';
import type { CreateServiceDto } from '../../../schemas/service.schemas';

// ── MongoDB in-memory setup ────────────────────────────────────────────────────

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // The Service model relies on a full-text index on `name` + `description`
  // to power the case-insensitive `$text` search used by findAll(). Build the
  // indexes explicitly before the property tests run, otherwise `$text`
  // queries would fail on the in-memory instance.
  await Category.init();
  await Category.createIndexes();
  await Service.init();
  await Service.createIndexes();
  await Service.syncIndexes();
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

/** Characters allowed in service names/descriptions (letters, digits, space). */
const TEXT_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split('');

/** A trimmed, non-empty service name of 1..100 chars. */
const serviceNameArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...TEXT_CHARS), { minLength: 1, maxLength: 100 })
  .map((chars) => chars.join('').trim())
  .filter((s) => s.length >= 1 && s.length <= 100);

/** A trimmed, non-empty description of 1..2000 chars. */
const descriptionArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...TEXT_CHARS), { minLength: 1, maxLength: 200 })
  .map((chars) => chars.join('').trim())
  .filter((s) => s.length >= 1 && s.length <= 2000);

/** A single lowercase alphabetic word (used as a searchable term). */
const wordArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
    minLength: 3,
    maxLength: 12,
  })
  .map((chars) => chars.join(''));

/** Distinct service names (case-insensitively unique) so name-sorting is total. */
const distinctNamesArb = (count: number): fc.Arbitrary<string[]> =>
  fc.uniqueArray(serviceNameArb, {
    minLength: count,
    maxLength: count,
    selector: (s) => s.toLowerCase(),
  });

/** Randomly flips the case of each character to produce a case-variant. */
const toCaseVariant = (s: string): string =>
  s
    .split('')
    .map((ch) => (Math.random() < 0.5 ? ch.toUpperCase() : ch.toLowerCase()))
    .join('');

/** Creates a Category document and returns its id as a string. */
async function createCategory(name = 'Categoría de prueba'): Promise<string> {
  const category = await Category.create({ name });
  return String(category._id);
}

/** Builds a valid CreateServiceDto for the given category. */
function buildServiceDto(
  categoryId: string,
  overrides: Partial<CreateServiceDto> = {}
): CreateServiceDto {
  return {
    name: 'Servicio base',
    category: categoryId,
    description: 'Descripción base del servicio de consultoría',
    images: ['https://example.com/img-1.png'],
    availabilityStatus: 'active',
    ...overrides,
  };
}

/** A non-existent but syntactically valid ObjectId string. */
function freshObjectId(): string {
  return new mongoose.Types.ObjectId().toString();
}

// ── Property 15: La actualización parcial modifica solo los campos provistos ──

// Feature: vaultra-consulting-backend, Property 15: La actualización parcial de servicios modifica solo los campos provistos
describe('Property 15 — La actualización parcial de servicios modifica solo los campos provistos', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 15: La actualización parcial de servicios modifica solo los campos provistos
    'update() solo altera los campos presentes en el dto y conserva el resto',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: serviceNameArb,
            description: descriptionArb,
            newName: serviceNameArb,
            newDescription: descriptionArb,
            newPrice: fc.integer({ min: 1, max: 100000 }),
            updateName: fc.boolean(),
            updateDescription: fc.boolean(),
            updatePrice: fc.boolean(),
          }),
          async (data) => {
            await Service.deleteMany({});
            await Category.deleteMany({});

            const categoryId = await createCategory();
            const created = await ServiceRepository.create(
              buildServiceDto(categoryId, {
                name: data.name,
                description: data.description,
                images: ['https://example.com/original.png'],
                price: 500,
              })
            );

            const dto: Record<string, unknown> = {};
            if (data.updateName) dto.name = data.newName;
            if (data.updateDescription) dto.description = data.newDescription;
            if (data.updatePrice) dto.price = data.newPrice;
            // Guarantee at least one field is present.
            if (Object.keys(dto).length === 0) dto.name = data.newName;

            const updated = await ServiceRepository.update(
              String(created._id),
              dto as never
            );

            // Provided fields must reflect the new values.
            if ('name' in dto) {
              expect(updated.name).toBe(dto.name);
            } else {
              expect(updated.name).toBe(data.name);
            }
            if ('description' in dto) {
              expect(updated.description).toBe(dto.description);
            } else {
              expect(updated.description).toBe(data.description);
            }
            if ('price' in dto) {
              expect(updated.price).toBe(dto.price);
            } else {
              expect(updated.price).toBe(500);
            }

            // Fields never included in any dto stay untouched.
            expect(updated.images).toEqual(['https://example.com/original.png']);
            expect(updated.availabilityStatus).toBe('active');
            expect(String(updated.category)).toBe(categoryId);
          }
        ),
        { numRuns: 100 }
      );
    },
    120000
  );
});

// ── Property 16: La referencia a categoría es validada en creación y actualización ──

// Feature: vaultra-consulting-backend, Property 16: La referencia a categoría es validada en creación y actualización
describe('Property 16 — La referencia a categoría es validada en creación y actualización', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 16: La referencia a categoría es validada en creación y actualización
    'create() con categoría inexistente lanza ConflictError y no persiste el servicio',
    async () => {
      await fc.assert(
        fc.asyncProperty(serviceNameArb, async (name) => {
          await Service.deleteMany({});
          await Category.deleteMany({});

          const missingCategory = freshObjectId();

          await expect(
            ServiceRepository.create(
              buildServiceDto(missingCategory, { name })
            )
          ).rejects.toBeInstanceOf(ConflictError);

          const count = await Service.countDocuments({});
          expect(count).toBe(0);
        }),
        { numRuns: 100 }
      );
    },
    120000
  );

  it(
    // Feature: vaultra-consulting-backend, Property 16: La referencia a categoría es validada en creación y actualización
    'update() con categoría inexistente lanza ConflictError y conserva la categoría original',
    async () => {
      await fc.assert(
        fc.asyncProperty(serviceNameArb, async (name) => {
          await Service.deleteMany({});
          await Category.deleteMany({});

          const categoryId = await createCategory();
          const created = await ServiceRepository.create(
            buildServiceDto(categoryId, { name })
          );

          const missingCategory = freshObjectId();
          await expect(
            ServiceRepository.update(String(created._id), {
              category: missingCategory,
            } as never)
          ).rejects.toBeInstanceOf(ConflictError);

          const after = await Service.findById(created._id);
          expect(after).not.toBeNull();
          expect(String(after!.category)).toBe(categoryId);
        }),
        { numRuns: 100 }
      );
    },
    120000
  );

  it(
    // Feature: vaultra-consulting-backend, Property 16: La referencia a categoría es validada en creación y actualización
    'create() y update() con categoría existente son aceptados',
    async () => {
      await fc.assert(
        fc.asyncProperty(distinctNamesArb(2), async ([nameA, nameB]) => {
          await Service.deleteMany({});
          await Category.deleteMany({});

          const catA = await createCategory('Cat A');
          const catB = await createCategory('Cat B');

          const created = await ServiceRepository.create(
            buildServiceDto(catA, { name: nameA })
          );
          expect(String(created.category)).toBe(catA);

          const updated = await ServiceRepository.update(
            String(created._id),
            { name: nameB, category: catB } as never
          );
          expect(String(updated.category)).toBe(catB);
        }),
        { numRuns: 100 }
      );
    },
    120000
  );
});

// ── Property 17: El listado público devuelve solo servicios activos ordenados por nombre ──

// Feature: vaultra-consulting-backend, Property 17: El listado público devuelve solo servicios activos ordenados por nombre
describe('Property 17 — El listado público devuelve solo servicios activos ordenados por nombre', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 17: El listado público devuelve solo servicios activos ordenados por nombre
    'findAll() retorna únicamente servicios activos, ordenados por nombre ASC',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .integer({ min: 1, max: 12 })
            .chain((n) =>
              fc.tuple(
                distinctNamesArb(n),
                fc.array(fc.boolean(), { minLength: n, maxLength: n })
              )
            ),
          async ([names, activeFlags]) => {
            await Service.deleteMany({});
            await Category.deleteMany({});

            const categoryId = await createCategory();

            for (let i = 0; i < names.length; i++) {
              await ServiceRepository.create(
                buildServiceDto(categoryId, {
                  name: names[i],
                  availabilityStatus: activeFlags[i] ? 'active' : 'inactive',
                })
              );
            }

            const expectedActive = names.filter((_, i) => activeFlags[i]);

            const result = await ServiceRepository.findAll({
              page: 1,
              limit: 100,
            });

            // Only active services are returned.
            expect(result.total).toBe(expectedActive.length);
            expect(result.data).toHaveLength(expectedActive.length);
            for (const svc of result.data) {
              expect(svc.availabilityStatus).toBe('active');
            }

            // Returned names are sorted ascending.
            const returnedNames = result.data.map((s) => s.name);
            const sorted = [...returnedNames].sort((a, b) =>
              a < b ? -1 : a > b ? 1 : 0
            );
            expect(returnedNames).toEqual(sorted);
          }
        ),
        { numRuns: 100 }
      );
    },
    120000
  );
});

// ── Property 18: La paginación es consistente y no superpone resultados ──

// Feature: vaultra-consulting-backend, Property 18: La paginación es consistente y no superpone resultados
describe('Property 18 — La paginación es consistente y no superpone resultados', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 18: La paginación es consistente y no superpone resultados
    'las páginas cubren todos los servicios activos sin repetir, con metadatos correctos',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .integer({ min: 1, max: 15 })
            .chain((n) =>
              fc.tuple(distinctNamesArb(n), fc.integer({ min: 1, max: 5 }))
            ),
          async ([names, limit]) => {
            await Service.deleteMany({});
            await Category.deleteMany({});

            const categoryId = await createCategory();
            for (const name of names) {
              await ServiceRepository.create(
                buildServiceDto(categoryId, { name })
              );
            }

            const total = names.length;
            const expectedTotalPages = Math.ceil(total / limit);

            const seenIds: string[] = [];
            const collectedNames: string[] = [];

            for (let page = 1; page <= expectedTotalPages; page++) {
              const result = await ServiceRepository.findAll({ page, limit });

              // Metadata must be consistent.
              expect(result.total).toBe(total);
              expect(result.page).toBe(page);
              expect(result.limit).toBe(limit);
              expect(result.totalPages).toBe(expectedTotalPages);

              // Page size never exceeds the limit.
              expect(result.data.length).toBeLessThanOrEqual(limit);

              for (const svc of result.data) {
                seenIds.push(String(svc._id));
                collectedNames.push(svc.name);
              }
            }

            // Every service appears exactly once across all pages.
            expect(seenIds).toHaveLength(total);
            expect(new Set(seenIds).size).toBe(total);

            // Global ordering by name is preserved across page boundaries.
            const sorted = [...collectedNames].sort((a, b) =>
              a < b ? -1 : a > b ? 1 : 0
            );
            expect(collectedNames).toEqual(sorted);
          }
        ),
        { numRuns: 100 }
      );
    },
    120000
  );
});

// ── Property 19: El filtro por categoría retorna solo servicios de esa categoría ──

// Feature: vaultra-consulting-backend, Property 19: El filtro por categoría retorna solo servicios de esa categoría
describe('Property 19 — El filtro por categoría retorna solo servicios de esa categoría', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 19: El filtro por categoría retorna solo servicios de esa categoría
    'findAll({category}) retorna solo los servicios activos de la categoría indicada',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 6 }).chain((total) =>
            fc.tuple(
              distinctNamesArb(total),
              fc.array(fc.boolean(), { minLength: total, maxLength: total })
            )
          ),
          async ([names, inCatA]) => {
            await Service.deleteMany({});
            await Category.deleteMany({});

            const catA = await createCategory('Categoría A');
            const catB = await createCategory('Categoría B');

            for (let i = 0; i < names.length; i++) {
              await ServiceRepository.create(
                buildServiceDto(inCatA[i] ? catA : catB, { name: names[i] })
              );
            }

            const expectedInA = names.filter((_, i) => inCatA[i]).length;

            const result = await ServiceRepository.findAll({
              page: 1,
              limit: 100,
              category: catA,
            });

            expect(result.total).toBe(expectedInA);
            expect(result.data).toHaveLength(expectedInA);
            for (const svc of result.data) {
              expect(String(svc.category)).toBe(catA);
            }
          }
        ),
        { numRuns: 100 }
      );
    },
    120000
  );

  it(
    // Feature: vaultra-consulting-backend, Property 19: El filtro por categoría retorna solo servicios de esa categoría
    'findAll({category}) con categoría inexistente lanza NotFoundError',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          await Service.deleteMany({});
          await Category.deleteMany({});

          const missing = freshObjectId();
          await expect(
            ServiceRepository.findAll({ page: 1, limit: 10, category: missing })
          ).rejects.toBeInstanceOf(NotFoundError);
        }),
        { numRuns: 100 }
      );
    },
    120000
  );
});

// ── Property 20: La búsqueda por término es case-insensitive (nombre y descripción) ──

// Feature: vaultra-consulting-backend, Property 20: La búsqueda por término es case-insensitive y abarca nombre y descripción
describe('Property 20 — La búsqueda por término es case-insensitive y abarca nombre y descripción', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 20: La búsqueda por término es case-insensitive y abarca nombre y descripción
    'findAll({search}) encuentra el servicio por término en nombre o descripción sin importar mayúsculas',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            term: wordArb,
            targetInName: fc.boolean(),
            noise: wordArb,
          }),
          async ({ term, targetInName, noise }) => {
            // Ensure the noise word differs from the search term so it can't
            // accidentally match a $text word-stem.
            fc.pre(noise !== term);

            await Service.deleteMany({});
            await Category.deleteMany({});

            const categoryId = await createCategory();

            // Target service contains `term` either in its name or description.
            const target = buildServiceDto(categoryId, {
              name: targetInName ? `Servicio ${term}` : 'Servicio generico',
              description: targetInName
                ? 'Descripcion sin coincidencias directas'
                : `Descripcion con ${term} incluido`,
            });
            const created = await ServiceRepository.create(target);

            // Distractor service that does NOT contain the term.
            await ServiceRepository.create(
              buildServiceDto(categoryId, {
                name: `Otro ${noise}`,
                description: `Sin el termino relevante ${noise}`,
              })
            );

            // Search using a case-variant of the term.
            const result = await ServiceRepository.findAll({
              page: 1,
              limit: 100,
              search: toCaseVariant(term),
            });

            const ids = result.data.map((s) => String(s._id));
            expect(ids).toContain(String(created._id));
            // Every returned service must actually contain the term
            // (case-insensitively) in name or description.
            for (const svc of result.data) {
              const haystack = `${svc.name} ${svc.description}`.toLowerCase();
              expect(haystack.includes(term.toLowerCase())).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    },
    120000
  );
});

// ── Property 21: Los servicios inactivos no son visibles en el catálogo público ──

// Feature: vaultra-consulting-backend, Property 21: Los servicios inactivos no son visibles en el catálogo público
describe('Property 21 — Los servicios inactivos no son visibles en el catálogo público', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 21: Los servicios inactivos no son visibles en el catálogo público
    'findAll() nunca incluye inactivos y findById() los trata como no encontrados',
    async () => {
      await fc.assert(
        fc.asyncProperty(serviceNameArb, async (name) => {
          await Service.deleteMany({});
          await Category.deleteMany({});

          const categoryId = await createCategory();
          const inactive = await ServiceRepository.create(
            buildServiceDto(categoryId, {
              name,
              availabilityStatus: 'inactive',
            })
          );

          // Not present in the public listing.
          const list = await ServiceRepository.findAll({ page: 1, limit: 100 });
          expect(list.total).toBe(0);
          expect(list.data).toHaveLength(0);

          // findById treats inactive as not found.
          await expect(
            ServiceRepository.findById(String(inactive._id))
          ).rejects.toBeInstanceOf(NotFoundError);
        }),
        { numRuns: 100 }
      );
    },
    120000
  );
});

// ── Property 22: Las respuestas de listado incluyen todos los campos requeridos ──

// Feature: vaultra-consulting-backend, Property 22: Las respuestas de listado de servicios incluyen todos los campos requeridos
describe('Property 22 — Las respuestas de listado de servicios incluyen todos los campos requeridos', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 22: Las respuestas de listado de servicios incluyen todos los campos requeridos
    'cada servicio del listado incluye id, name, category, images, description, price y availabilityStatus',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: serviceNameArb,
            description: descriptionArb,
            withPrice: fc.boolean(),
            price: fc.integer({ min: 1, max: 100000 }),
          }),
          async ({ name, description, withPrice, price }) => {
            await Service.deleteMany({});
            await Category.deleteMany({});

            const categoryId = await createCategory();
            await ServiceRepository.create(
              buildServiceDto(categoryId, {
                name,
                description,
                images: [
                  'https://example.com/a.png',
                  'https://example.com/b.png',
                ],
                price: withPrice ? price : undefined,
              })
            );

            const result = await ServiceRepository.findAll({
              page: 1,
              limit: 10,
            });
            expect(result.data).toHaveLength(1);

            const svc = result.data[0];
            // id is present.
            expect(svc._id).toBeDefined();
            // name / description round-trip.
            expect(svc.name).toBe(name);
            expect(svc.description).toBe(description);
            // category reference present.
            expect(String(svc.category)).toBe(categoryId);
            // images preserved.
            expect(svc.images).toEqual([
              'https://example.com/a.png',
              'https://example.com/b.png',
            ]);
            // availabilityStatus present.
            expect(svc.availabilityStatus).toBe('active');
            // price field behaves as expected (present when provided).
            if (withPrice) {
              expect(svc.price).toBe(price);
            } else {
              expect(svc.price).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    },
    120000
  );
});
