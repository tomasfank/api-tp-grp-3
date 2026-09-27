import { Request, Response, NextFunction } from 'express';
import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { authMiddleware, roleMiddleware } from '../../../middlewares/auth.middleware';
import { TokenBlacklist } from '../../../models/token-blacklist.model';
import { AuthenticationError, AuthorizationError } from '../../../errors';

// ── MongoDB in-memory setup ────────────────────────────────────────────────────
// authMiddleware queries the TokenBlacklist collection, so a real (in-memory)
// MongoDB connection is required.

let mongod: MongoMemoryServer;

const JWT_SECRET = 'test-secret-for-middleware-property-tests';

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  process.env.JWT_SECRET = JWT_SECRET;
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

/** Builds Express-like req/res/next mocks. `next` captures whatever it receives
 *  so we can assert on the error the middleware forwards. */
function buildContext(authHeader?: string, user?: { id: string; role: string }) {
  const captured: { error?: unknown; called: boolean } = { called: false };

  const req = {
    headers: authHeader !== undefined ? { authorization: authHeader } : {},
    user,
    // A body that MUST NOT be processed by a protected handler when auth fails.
    body: { sentinel: 'should-not-be-processed' },
  } as unknown as Request;

  // res is intentionally minimal — protected middlewares must not write a body
  // themselves; they delegate to `next(error)`.
  const res = {} as Response;

  const next: NextFunction = ((err?: unknown) => {
    captured.called = true;
    captured.error = err;
  }) as NextFunction;

  return { req, res, next, captured };
}

/** Signs a JWT with the given payload/options using a chosen secret. */
function signToken(
  payload: Record<string, unknown>,
  secret: string = JWT_SECRET,
  options?: jwt.SignOptions
): string {
  return jwt.sign(payload, secret, options);
}

// ── Property 9: Los endpoints protegidos rechazan requests sin JWT válido ──────

// Feature: vaultra-consulting-backend, Property 9: Los endpoints protegidos rechazan requests sin JWT válido
describe('Property 9 — Los endpoints protegidos rechazan requests sin JWT válido', () => {
  // Case A: missing Authorization header entirely
  it(
    // Feature: vaultra-consulting-backend, Property 9: Los endpoints protegidos rechazan requests sin JWT válido
    'requests sin header Authorization son rechazadas con AuthenticationError (401)',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(undefined), async () => {
          const { req, res, next, captured } = buildContext(undefined);

          await authMiddleware(req, res, next);

          expect(captured.called).toBe(true);
          expect(captured.error).toBeInstanceOf(AuthenticationError);
          expect((captured.error as AuthenticationError).statusCode).toBe(401);
          // req.user must NOT be populated when auth fails
          expect(req.user).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    },
    60000
  );

  // Case B: malformed Authorization header (wrong scheme, missing token, extra parts…)
  it(
    // Feature: vaultra-consulting-backend, Property 9: Los endpoints protegidos rechazan requests sin JWT válido
    'requests con header Authorization malformado son rechazadas con AuthenticationError (401)',
    async () => {
      // Generate a valid token so that "Bearer <valid>" is explicitly excluded
      // from the malformed set.
      const validToken = signToken({ id: 'abc', role: 'admin' });

      const malformedHeaderArb = fc.oneof(
        fc.constant(''),
        fc.constant('Bearer'), // scheme only, no token
        fc.constant(`Token ${validToken}`), // wrong scheme
        fc.constant(`Basic ${validToken}`), // wrong scheme
        fc.constant(`Bearer ${validToken} extra`), // more than 2 parts
        fc.constant(validToken), // token without scheme
        fc
          .string({ minLength: 1, maxLength: 40 })
          .filter((s) => !/^bearer\s+\S+$/i.test(s.trim())),
      );

      await fc.assert(
        fc.asyncProperty(malformedHeaderArb, async (header) => {
          const { req, res, next, captured } = buildContext(header);

          await authMiddleware(req, res, next);

          expect(captured.called).toBe(true);
          expect(captured.error).toBeInstanceOf(AuthenticationError);
          expect((captured.error as AuthenticationError).statusCode).toBe(401);
          expect(req.user).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    },
    60000
  );

  // Case C: token signed with the WRONG secret (invalid signature)
  it(
    // Feature: vaultra-consulting-backend, Property 9: Los endpoints protegidos rechazan requests sin JWT válido
    'requests con token firmado con clave incorrecta son rechazadas con AuthenticationError (401)',
    async () => {
      const wrongSecretArb = fc
        .string({ minLength: 1, maxLength: 40 })
        .filter((s) => s !== JWT_SECRET);

      await fc.assert(
        fc.asyncProperty(
          wrongSecretArb,
          fc.string({ minLength: 1, maxLength: 30 }),
          async (wrongSecret, id) => {
            const token = signToken({ id, role: 'admin' }, wrongSecret);
            const { req, res, next, captured } = buildContext(`Bearer ${token}`);

            await authMiddleware(req, res, next);

            expect(captured.called).toBe(true);
            expect(captured.error).toBeInstanceOf(AuthenticationError);
            expect((captured.error as AuthenticationError).statusCode).toBe(401);
            expect(req.user).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    },
    60000
  );

  // Case D: expired token (correct secret, but exp in the past)
  it(
    // Feature: vaultra-consulting-backend, Property 9: Los endpoints protegidos rechazan requests sin JWT válido
    'requests con token expirado son rechazadas con AuthenticationError (401)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.integer({ min: 1, max: 100000 }),
          async (id, secondsAgo) => {
            // expiresIn negative → token already expired
            const token = signToken({ id, role: 'admin' }, JWT_SECRET, {
              expiresIn: -secondsAgo,
            });
            const { req, res, next, captured } = buildContext(`Bearer ${token}`);

            await authMiddleware(req, res, next);

            expect(captured.called).toBe(true);
            expect(captured.error).toBeInstanceOf(AuthenticationError);
            expect((captured.error as AuthenticationError).statusCode).toBe(401);
            expect(req.user).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    },
    60000
  );

  // Case E: blacklisted token (valid signature + not expired, but revoked)
  it(
    // Feature: vaultra-consulting-backend, Property 9: Los endpoints protegidos rechazan requests sin JWT válido
    'requests con token en la blacklist son rechazadas con AuthenticationError (401)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 }),
          async (id) => {
            await TokenBlacklist.deleteMany({});

            const token = signToken({ id, role: 'admin' }, JWT_SECRET, {
              expiresIn: '1h',
            });

            // Revoke the token by adding it to the blacklist.
            await TokenBlacklist.create({
              token,
              expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            });

            const { req, res, next, captured } = buildContext(`Bearer ${token}`);

            await authMiddleware(req, res, next);

            expect(captured.called).toBe(true);
            expect(captured.error).toBeInstanceOf(AuthenticationError);
            expect((captured.error as AuthenticationError).statusCode).toBe(401);
            expect(req.user).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    },
    60000
  );
});

// ── Property 10: Los endpoints admin rechazan tokens con role distinto a 'admin' ──

// Feature: vaultra-consulting-backend, Property 10: Los endpoints admin rechazan tokens con role distinto a 'admin'
describe("Property 10 — Los endpoints admin rechazan tokens con role distinto a 'admin'", () => {
  const adminRole = roleMiddleware('admin');

  it(
    // Feature: vaultra-consulting-backend, Property 10: Los endpoints admin rechazan tokens con role distinto a 'admin'
    "cualquier req.user con role != 'admin' es rechazado con AuthorizationError (403)",
    () => {
      // Any role string that is NOT exactly 'admin'.
      const nonAdminRoleArb = fc
        .oneof(
          fc.constant('user'),
          fc.constant('visitor'),
          fc.constant('editor'),
          fc.constant('Admin'), // case-sensitive: must be rejected
          fc.constant('ADMIN'),
          fc.constant(''),
          fc.string({ maxLength: 30 }),
        )
        .filter((r) => r !== 'admin');

      fc.assert(
        fc.property(
          nonAdminRoleArb,
          fc.string({ minLength: 1, maxLength: 30 }),
          (role, id) => {
            const { req, res, next, captured } = buildContext(undefined, { id, role });

            adminRole(req, res, next);

            expect(captured.called).toBe(true);
            expect(captured.error).toBeInstanceOf(AuthorizationError);
            expect((captured.error as AuthorizationError).statusCode).toBe(403);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 10: Los endpoints admin rechazan tokens con role distinto a 'admin'
    'requests sin req.user (autenticación fallida previa) son rechazadas con AuthorizationError (403)',
    () => {
      fc.assert(
        fc.property(fc.constant(undefined), () => {
          const { req, res, next, captured } = buildContext(undefined, undefined);

          adminRole(req, res, next);

          expect(captured.called).toBe(true);
          expect(captured.error).toBeInstanceOf(AuthorizationError);
          expect((captured.error as AuthorizationError).statusCode).toBe(403);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 10: Los endpoints admin rechazan tokens con role distinto a 'admin'
    "req.user con role === 'admin' pasa el middleware sin error",
    () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 30 }), (id) => {
          const { req, res, next, captured } = buildContext(undefined, {
            id,
            role: 'admin',
          });

          adminRole(req, res, next);

          expect(captured.called).toBe(true);
          expect(captured.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    }
  );
});
