import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { TokenBlacklist } from '../../../models/token-blacklist.model';
import { ConflictError, AuthenticationError } from '../../../errors';

// ── MongoDB in-memory setup ────────────────────────────────────────────────────

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  process.env.JWT_SECRET = 'test-secret-for-property-tests';
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

/** Generates a valid RegisterDto with arbitrary name/lastName while fixing
 *  email and password to simple, guaranteed-valid values. */
const validRegisterArb = fc.record({
  name: fc
    .string({ minLength: 1, maxLength: 50 })
    .map((s) => s.replace(/[\x00-\x1f]/g, 'a') || 'a')
    .filter((s) => s.trim().length > 0),
  lastName: fc
    .string({ minLength: 1, maxLength: 50 })
    .map((s) => s.replace(/[\x00-\x1f]/g, 'b') || 'b')
    .filter((s) => s.trim().length > 0),
  email: fc.emailAddress(),
  password: fc.constant('ValidPass1!'),
});

// ── Property 1: Las contraseñas nunca se persisten en texto plano ──────────────

// Feature: vaultra-consulting-backend, Property 1: Las contraseñas nunca se persisten en texto plano
describe('Property 1 — Las contraseñas nunca se persisten en texto plano', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 1: Las contraseñas nunca se persisten en texto plano
    'El campo password en DB nunca es igual al texto plano y siempre empieza con $2b$',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterArb, async (dto) => {
          await User.deleteMany({});
          await TokenBlacklist.deleteMany({});

          await AuthService.register(dto);

          const userInDb = await User.findOne({ email: dto.email.toLowerCase() });
          expect(userInDb).not.toBeNull();
          expect(userInDb!.password).not.toBe(dto.password);
          expect(userInDb!.password.startsWith('$2b$')).toBe(true);
        }),
        { numRuns: 100 }
      );
    },
    60000
  );
});

// ── Property 2: El registro rechaza emails duplicados ─────────────────────────

// Feature: vaultra-consulting-backend, Property 2: El registro rechaza emails duplicados
describe('Property 2 — El registro rechaza emails duplicados', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 2: El registro rechaza emails duplicados
    'Registrar dos veces el mismo email lanza ConflictError y no crea duplicados',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterArb, async (dto) => {
          await User.deleteMany({});
          await TokenBlacklist.deleteMany({});

          // First registration must succeed
          await AuthService.register(dto);

          // Second registration with same email must throw ConflictError
          await expect(AuthService.register(dto)).rejects.toBeInstanceOf(ConflictError);

          // Only one document with that email must exist
          const count = await User.countDocuments({ email: dto.email.toLowerCase() });
          expect(count).toBe(1);
        }),
        { numRuns: 100 }
      );
    },
    60000
  );
});

// ── Property 3: El login rechaza credenciales incorrectas con error genérico ──

// Feature: vaultra-consulting-backend, Property 3: El login rechaza credenciales incorrectas con error genérico
describe('Property 3 — El login rechaza credenciales incorrectas con error genérico', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 3: El login rechaza credenciales incorrectas con error genérico
    'Email correcto + contraseña incorrecta y email incorrecto + contraseña correcta lanzan el mismo AuthenticationError',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterArb, async (dto) => {
          await User.deleteMany({});
          await TokenBlacklist.deleteMany({});

          await AuthService.register(dto);

          // Correct email, wrong password
          let errorA: AuthenticationError | null = null;
          try {
            await AuthService.login(dto.email, 'WrongPass9!');
          } catch (e) {
            errorA = e as AuthenticationError;
          }

          // Wrong email, correct password
          let errorB: AuthenticationError | null = null;
          try {
            await AuthService.login('nonexistent@example.com', dto.password);
          } catch (e) {
            errorB = e as AuthenticationError;
          }

          expect(errorA).toBeInstanceOf(AuthenticationError);
          expect(errorB).toBeInstanceOf(AuthenticationError);
          // Both errors must carry the EXACT same message (indistinguishable)
          expect(errorA!.message).toBe(errorB!.message);
          expect(errorA!.message).toBe('Credenciales incorrectas');
        }),
        { numRuns: 100 }
      );
    },
    60000
  );
});

// ── Property 4: El token JWT emitido en login es válido y contiene los claims correctos ──

// Feature: vaultra-consulting-backend, Property 4: El token JWT emitido en login es válido y contiene los claims correctos
describe('Property 4 — El token JWT emitido en login es válido y contiene los claims correctos', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 4: El token JWT emitido en login es válido y contiene los claims correctos
    'El JWT contiene id (string), role: admin y exp ≤ now + 24h + buffer',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterArb, async (dto) => {
          await User.deleteMany({});
          await TokenBlacklist.deleteMany({});

          await AuthService.register(dto);
          const { token } = await AuthService.login(dto.email, dto.password);

          // Must verify without error
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

          expect(typeof decoded.id).toBe('string');
          expect(decoded.role).toBe('admin');

          const nowSeconds = Math.floor(Date.now() / 1000);
          const twentyFourHoursInSeconds = 24 * 60 * 60;
          const bufferSeconds = 60; // 1 minute buffer

          expect(decoded.exp).toBeDefined();
          expect(decoded.exp!).toBeLessThanOrEqual(
            nowSeconds + twentyFourHoursInSeconds + bufferSeconds
          );
        }),
        { numRuns: 100 }
      );
    },
    60000
  );
});

// ── Property 5: El logout invalida el token de forma permanente ───────────────

// Feature: vaultra-consulting-backend, Property 5: El logout invalida el token de forma permanente
describe('Property 5 — El logout invalida el token de forma permanente', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 5: El logout invalida el token de forma permanente
    'Después del logout, el token aparece en TokenBlacklist',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterArb, async (dto) => {
          await User.deleteMany({});
          await TokenBlacklist.deleteMany({});

          await AuthService.register(dto);
          const { token } = await AuthService.login(dto.email, dto.password);

          await AuthService.logout(token);

          const blacklisted = await TokenBlacklist.findOne({ token });
          expect(blacklisted).not.toBeNull();
          expect(blacklisted!.token).toBe(token);
        }),
        { numRuns: 100 }
      );
    },
    60000
  );
});

// ── Property 6: El reset token de contraseña expira en máximo 1 hora ──────────

// Feature: vaultra-consulting-backend, Property 6: El reset token de contraseña expira en máximo 1 hora
describe('Property 6 — El reset token de contraseña expira en máximo 1 hora', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 6: El reset token de contraseña expira en máximo 1 hora
    'resetTokenExp es ≤ now + 1 hora + 5s buffer',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterArb, async (dto) => {
          await User.deleteMany({});
          await TokenBlacklist.deleteMany({});

          await AuthService.register(dto);

          const before = Date.now();
          await AuthService.requestPasswordReset(dto.email);
          const after = Date.now();

          const user = await User.findOne({ email: dto.email.toLowerCase() });
          expect(user).not.toBeNull();
          expect(user!.resetTokenExp).toBeDefined();

          const maxExp = after + 60 * 60 * 1000 + 5000; // 1h + 5s buffer
          expect(user!.resetTokenExp!.getTime()).toBeLessThanOrEqual(maxExp);
          // Also ensure it's not in the past
          expect(user!.resetTokenExp!.getTime()).toBeGreaterThanOrEqual(before);
        }),
        { numRuns: 100 }
      );
    },
    60000
  );
});

// ── Property 7: El restablecimiento de contraseña es un round-trip funcional ──

// Feature: vaultra-consulting-backend, Property 7: El restablecimiento de contraseña es un round-trip funcional
describe('Property 7 — El restablecimiento de contraseña es un round-trip funcional', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 7: El restablecimiento de contraseña es un round-trip funcional
    'Después de resetPassword, login con la contraseña antigua falla y con la nueva tiene éxito',
    async () => {
      await fc.assert(
        fc.asyncProperty(validRegisterArb, async (dto) => {
          await User.deleteMany({});
          await TokenBlacklist.deleteMany({});

          await AuthService.register(dto);
          const { resetToken } = await AuthService.requestPasswordReset(dto.email);

          const newPassword = 'NewValidPass2@';
          await AuthService.resetPassword(resetToken, newPassword);

          // Old password must no longer work
          await expect(
            AuthService.login(dto.email, dto.password)
          ).rejects.toBeInstanceOf(AuthenticationError);

          // New password must work and return a token
          const result = await AuthService.login(dto.email, newPassword);
          expect(result).toHaveProperty('token');
          expect(typeof result.token).toBe('string');
          expect(result.token.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    },
    60000
  );
});

// ── Property 8: La actualización parcial de perfil modifica solo los campos provistos ──

// Feature: vaultra-consulting-backend, Property 8: La actualización parcial de perfil modifica solo los campos provistos
describe('Property 8 — La actualización parcial de perfil modifica solo los campos provistos', () => {
  it(
    // Feature: vaultra-consulting-backend, Property 8: La actualización parcial de perfil modifica solo los campos provistos
    'updateProfile con un subconjunto de {name, lastName, phone} solo modifica esos campos',
    async () => {
      // Arbitraries for update subsets — at least one field must be present.
      // The User model declares `trim: true` on name/lastName, so Mongoose
      // stores the trimmed value. We generate already-trimmed strings (dropping
      // control characters and surrounding whitespace) so the stored value
      // matches the input exactly.
      const cleanStr = (fill: string) =>
        fc
          .string({ minLength: 1, maxLength: 50 })
          .map((s) => s.replace(/[\x00-\x1f]/g, fill).trim() || fill)
          .filter((s) => s.trim().length > 0);

      const updateDtoArb: fc.Arbitrary<{ name?: string; lastName?: string; phone?: string }> =
        fc.oneof(
          // Only name
          cleanStr('c').map((name) => ({ name })),
          // Only lastName
          cleanStr('d').map((lastName) => ({ lastName })),
          // Only phone
          fc.stringMatching(/^\d{7,15}$/).map((phone) => ({ phone })),
          // name + lastName
          fc.record({
            name: cleanStr('e'),
            lastName: cleanStr('f'),
          }),
        );

      await fc.assert(
        fc.asyncProperty(validRegisterArb, updateDtoArb, async (dto, updateDto) => {
          await User.deleteMany({});
          await TokenBlacklist.deleteMany({});

          const registered = await AuthService.register(dto);
          const adminId = String((registered as { _id: unknown })._id);

          const before = await User.findById(adminId);
          expect(before).not.toBeNull();

          await AuthService.updateProfile(adminId, updateDto);

          const after = await User.findById(adminId);
          expect(after).not.toBeNull();

          // Fields in the dto must have changed
          if (updateDto.name !== undefined) {
            expect(after!.name).toBe(updateDto.name);
          }
          if (updateDto.lastName !== undefined) {
            expect(after!.lastName).toBe(updateDto.lastName);
          }
          if (updateDto.phone !== undefined) {
            expect(after!.phone).toBe(updateDto.phone);
          }

          // Fields NOT in the dto must remain unchanged
          if (updateDto.name === undefined) {
            expect(after!.name).toBe(before!.name);
          }
          if (updateDto.lastName === undefined) {
            expect(after!.lastName).toBe(before!.lastName);
          }
          if (updateDto.phone === undefined) {
            expect(after!.phone).toBe(before!.phone);
          }

          // Sensitive fields must never change
          expect(after!.email).toBe(before!.email);
          expect(after!.password).toBe(before!.password);
        }),
        { numRuns: 100 }
      );
    },
    120000
  );
});
