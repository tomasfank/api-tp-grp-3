import { z } from 'zod';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Password: ≥8 chars, at least 1 uppercase letter, at least 1 digit or symbol */
const passwordSchema = z
  .string()
  .min(8, 'Debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[0-9!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/, 'Debe contener al menos un dígito o símbolo');

/** Phone: optional, 7-15 numeric digits */
const phoneSchema = z
  .string()
  .regex(/^\d{7,15}$/, 'El teléfono debe contener entre 7 y 15 dígitos numéricos')
  .optional();

// ── schemas ───────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(100, 'El apellido no puede superar los 100 caracteres'),
  email: z.email('El formato del correo electrónico no es válido'),
  password: passwordSchema,
  phone: phoneSchema,
});

export const LoginSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es requerido'),
});

export const ResetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'El token de restablecimiento es requerido'),
  newPassword: passwordSchema,
});

export const UpdateProfileSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre no puede estar vacío')
      .max(100, 'El nombre no puede superar los 100 caracteres')
      .optional(),
    lastName: z
      .string()
      .min(1, 'El apellido no puede estar vacío')
      .max(100, 'El apellido no puede superar los 100 caracteres')
      .optional(),
    phone: phoneSchema,
  })
  .refine(
    (data) => data.name !== undefined || data.lastName !== undefined || data.phone !== undefined,
    { message: 'Debe proporcionar al menos un campo para actualizar' }
  );

// ── inferred types ────────────────────────────────────────────────────────────

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
