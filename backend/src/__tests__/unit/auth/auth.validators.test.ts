// Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados

import * as fc from 'fast-check';
import {
  RegisterSchema,
  UpdateProfileSchema,
} from '../../../schemas/auth.schemas';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Extracts all top-level field paths from a Zod parse failure */
function failedFields(result: ReturnType<typeof RegisterSchema.safeParse>): string[] {
  if (result.success) return [];
  return result.error.issues.map((i) => String(i.path[0] ?? ''));
}

// ─── Property 11 — RegisterSchema ─────────────────────────────────────────────

describe('Property 11 — RegisterSchema: campos inválidos siempre listados en issues', () => {

  // Requirement 2.3 — missing / empty required fields
  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 2.3 — name vacío siempre produce issue en el campo name',
    () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.constant(''),
            lastName: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            password: fc.constant('ValidPass1'),
          }),
          (input) => {
            const result = RegisterSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(failedFields(result)).toContain('name');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 2.3 — lastName vacío siempre produce issue en el campo lastName',
    () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            lastName: fc.constant(''),
            email: fc.emailAddress(),
            password: fc.constant('ValidPass1'),
          }),
          (input) => {
            const result = RegisterSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(failedFields(result)).toContain('lastName');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 2.3 — email inválido (sin @) siempre produce issue en el campo email',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('@') && s.trim().length > 0),
          (badEmail) => {
            const input = {
              name: 'Nombre',
              lastName: 'Apellido',
              email: badEmail,
              password: 'ValidPass1',
            };
            const result = RegisterSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(failedFields(result)).toContain('email');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  // Requirement 2.4 — invalid password constraints
  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 2.4 — contraseña con menos de 8 caracteres siempre produce issue en el campo password',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 7 }),
          (shortPassword) => {
            const input = {
              name: 'Nombre',
              lastName: 'Apellido',
              email: 'user@example.com',
              password: shortPassword,
            };
            const result = RegisterSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(failedFields(result)).toContain('password');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 2.4 — contraseña sin mayúscula siempre produce issue en el campo password',
    () => {
      fc.assert(
        fc.property(
          // 8+ chars, all lowercase letters only
          fc.stringMatching(/^[a-z]{8,30}$/),
          (passwordNoUpper) => {
            const input = {
              name: 'Nombre',
              lastName: 'Apellido',
              email: 'user@example.com',
              password: passwordNoUpper,
            };
            const result = RegisterSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(failedFields(result)).toContain('password');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 2.4 — contraseña sin dígito ni símbolo siempre produce issue en el campo password',
    () => {
      fc.assert(
        fc.property(
          // 8+ chars, at least one uppercase, but ONLY letters (no digit, no symbol)
          fc.stringMatching(/^[a-zA-Z]{8,30}$/).filter((s) => /[A-Z]/.test(s)),
          (passwordNoDigitOrSymbol) => {
            const input = {
              name: 'Nombre',
              lastName: 'Apellido',
              email: 'user@example.com',
              password: passwordNoDigitOrSymbol,
            };
            const result = RegisterSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(failedFields(result)).toContain('password');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 2.3 — name con más de 100 caracteres siempre produce issue en el campo name',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }),
          (longName) => {
            const input = {
              name: longName,
              lastName: 'Apellido',
              email: 'user@example.com',
              password: 'ValidPass1',
            };
            const result = RegisterSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(failedFields(result)).toContain('name');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 2.3 — lastName con más de 100 caracteres siempre produce issue en el campo lastName',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }),
          (longLastName) => {
            const input = {
              name: 'Nombre',
              lastName: longLastName,
              email: 'user@example.com',
              password: 'ValidPass1',
            };
            const result = RegisterSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(failedFields(result)).toContain('lastName');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 2.3 — phone con caracteres no numéricos siempre produce issue en el campo phone',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /\D/.test(s)),
          (badPhone) => {
            const input = {
              name: 'Nombre',
              lastName: 'Apellido',
              email: 'user@example.com',
              password: 'ValidPass1',
              phone: badPhone,
            };
            const result = RegisterSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(failedFields(result)).toContain('phone');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 2.3 — phone numérico fuera del rango 7-15 dígitos produce issue en el campo phone',
    () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // too short: 1-6 digits
            fc.integer({ min: 1, max: 6 }).chain((len) =>
              fc.stringMatching(new RegExp(`^\\d{${len}}$`))
            ),
            // too long: 16-20 digits
            fc.integer({ min: 16, max: 20 }).chain((len) =>
              fc.stringMatching(new RegExp(`^\\d{${len}}$`))
            )
          ),
          (badPhone) => {
            const input = {
              name: 'Nombre',
              lastName: 'Apellido',
              email: 'user@example.com',
              password: 'ValidPass1',
              phone: badPhone,
            };
            const result = RegisterSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(failedFields(result)).toContain('phone');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 11 — UpdateProfileSchema ───────────────────────────────────────

describe('Property 11 — UpdateProfileSchema: campos inválidos siempre listados en issues', () => {

  // Requirement 3.3
  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 3.3 — name vacío produce issue en el campo name',
    () => {
      fc.assert(
        fc.property(
          fc.constant({ name: '' }),
          (input) => {
            const result = UpdateProfileSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fields = result.error.issues.map((i) => String(i.path[0] ?? ''));
              expect(fields).toContain('name');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 3.3 — name con más de 100 caracteres produce issue en el campo name',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }),
          (longName) => {
            const result = UpdateProfileSchema.safeParse({ name: longName });
            expect(result.success).toBe(false);
            if (!result.success) {
              const fields = result.error.issues.map((i) => String(i.path[0] ?? ''));
              expect(fields).toContain('name');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 3.3 — lastName vacío produce issue en el campo lastName',
    () => {
      fc.assert(
        fc.property(
          fc.constant({ lastName: '' }),
          (input) => {
            const result = UpdateProfileSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fields = result.error.issues.map((i) => String(i.path[0] ?? ''));
              expect(fields).toContain('lastName');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 3.3 — lastName con más de 100 caracteres produce issue en el campo lastName',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }),
          (longLastName) => {
            const result = UpdateProfileSchema.safeParse({ lastName: longLastName });
            expect(result.success).toBe(false);
            if (!result.success) {
              const fields = result.error.issues.map((i) => String(i.path[0] ?? ''));
              expect(fields).toContain('lastName');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 3.3 — phone con caracteres no numéricos produce issue en el campo phone',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /\D/.test(s)),
          (badPhone) => {
            const result = UpdateProfileSchema.safeParse({ phone: badPhone });
            expect(result.success).toBe(false);
            if (!result.success) {
              const fields = result.error.issues.map((i) => String(i.path[0] ?? ''));
              expect(fields).toContain('phone');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: vaultra-consulting-backend, Property 11: La validación de campos inválidos siempre lista los campos afectados
    'Req 3.3 — objeto vacío {} dispara el refinement y produce un mensaje de error',
    () => {
      const result = UpdateProfileSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages.some((m) => m.includes('al menos un campo'))).toBe(true);
      }
    }
  );
});
