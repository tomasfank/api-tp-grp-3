import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { ContactRepository } from '../../../repositories/contact.repository';
import { Contact } from '../../../models/contact.model';
import type { CreateContactDto } from '../../../schemas/contact.schemas';

// ── MongoDB in-memory setup ────────────────────────────────────────────────────

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Ensure the Contact model's indexes are built before running the property
  // tests so persisted documents behave exactly as they would in production.
  await Contact.init();
  await Contact.createIndexes();
  await Contact.syncIndexes();
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
 * Generates a trimmed, non-empty string within the given length bounds and free
 * of control characters, matching what the Contact model stores (the string
 * fields declare `trim: true`).
 */
const TEXT_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split('');

const trimmedTextArb = (maxLength: number): fc.Arbitrary<string> =>
  fc
    .array(fc.constantFrom(...TEXT_CHARS), { minLength: 1, maxLength })
    .map((chars) => chars.join('').trim())
    .filter((s) => s.length >= 1 && s.length <= maxLength);

/** Email addresses stored lowercased/trimmed by the model. */
const emailArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
      minLength: 1,
      maxLength: 20,
    }),
    fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
      minLength: 1,
      maxLength: 15,
    }),
    fc.constantFrom('com', 'net', 'org', 'io')
  )
  .map(([local, domain, tld]) => `${local.join('')}@${domain.join('')}.${tld}`);

/** Phone: 7-15 numeric digits, mirroring the schema constraint. */
const phoneArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...'0123456789'.split('')), { minLength: 7, maxLength: 15 })
  .map((digits) => digits.join(''));

/** A contact payload WITHOUT phone. */
const contactWithoutPhoneArb: fc.Arbitrary<CreateContactDto> = fc.record({
  name: trimmedTextArb(100),
  email: emailArb,
  subject: trimmedTextArb(200),
  message: trimmedTextArb(5000),
});

/** A contact payload WITH phone. */
const contactWithPhoneArb: fc.Arbitrary<CreateContactDto> = fc.record({
  name: trimmedTextArb(100),
  email: emailArb,
  phone: phoneArb,
  subject: trimmedTextArb(200),
  message: trimmedTextArb(5000),
});

// ── Property 23: Las consultas de contacto se persisten con estado 'pending' y timestamp ──

// Feature: vaultra-consulting-backend, Property 23: Las consultas de contacto se persisten con estado 'pending' y timestamp
describe("Property 23 — Las consultas de contacto se persisten con estado 'pending' y timestamp", () => {
  it(
    // Feature: vaultra-consulting-backend, Property 23: Las consultas de contacto se persisten con estado 'pending' y timestamp
    "create() persiste el contacto con status 'pending' y un createdAt válido",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(contactWithoutPhoneArb, contactWithPhoneArb),
          async (dto) => {
            await Contact.deleteMany({});

            const before = Date.now();
            const created = await ContactRepository.create(dto);
            const after = Date.now();

            // The returned document is persisted with status 'pending'.
            expect(created.status).toBe('pending');
            expect(created.createdAt).toBeInstanceOf(Date);
            const ts = created.createdAt.getTime();
            expect(ts).toBeGreaterThanOrEqual(before - 1000);
            expect(ts).toBeLessThanOrEqual(after + 1000);

            // The persisted document (re-read from the DB) matches.
            const persisted = await Contact.findById(created._id);
            expect(persisted).not.toBeNull();
            expect(persisted!.status).toBe('pending');
            expect(persisted!.createdAt).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    },
    120000
  );
});

// ── Property 24: El campo teléfono de contacto es null cuando no se provee ──

// Feature: vaultra-consulting-backend, Property 24: El campo teléfono de contacto es null cuando no se provee
describe('Property 24 — El campo teléfono de contacto es null cuando no se provee', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 24: El campo teléfono de contacto es null cuando no se provee
    'create() guarda phone como null exactamente cuando no se provee, y lo conserva cuando sí se provee',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          contactWithoutPhoneArb,
          fc.option(phoneArb, { nil: undefined }),
          async (base, maybePhone) => {
            await Contact.deleteMany({});

            const dto: CreateContactDto =
              maybePhone === undefined ? base : { ...base, phone: maybePhone };

            const created = await ContactRepository.create(dto);
            const persisted = await Contact.findById(created._id);
            expect(persisted).not.toBeNull();

            if (maybePhone === undefined) {
              // Phone omitted → stored as null.
              expect(created.phone).toBeNull();
              expect(persisted!.phone).toBeNull();
            } else {
              // Phone provided → stored verbatim (never null).
              expect(created.phone).toBe(maybePhone);
              expect(persisted!.phone).toBe(maybePhone);
            }
          }
        ),
        { numRuns: 100 }
      );
    },
    120000
  );
});
