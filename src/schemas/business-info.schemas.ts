import { z } from 'zod';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Business name: trimmed, up to 200 characters. */
const businessNameSchema = z
  .string({ error: 'El nombre debe ser una cadena de texto' })
  .trim()
  .min(1, 'El nombre no puede estar vacío')
  .max(200, 'El nombre no puede superar los 200 caracteres');

/** Description: trimmed, up to 2000 characters. */
const descriptionSchema = z
  .string({ error: 'La descripción debe ser una cadena de texto' })
  .trim()
  .min(1, 'La descripción no puede estar vacía')
  .max(2000, 'La descripción no puede superar los 2000 caracteres');

/** Address: trimmed, up to 300 characters. */
const addressSchema = z
  .string({ error: 'La dirección debe ser una cadena de texto' })
  .trim()
  .min(1, 'La dirección no puede estar vacía')
  .max(300, 'La dirección no puede superar los 300 caracteres');

/** Phone: 7-15 numeric digits. */
const phoneSchema = z
  .string({ error: 'El teléfono debe ser una cadena de texto' })
  .regex(/^\d{7,15}$/, 'El teléfono debe contener entre 7 y 15 dígitos numéricos');

/** Social media: object mapping string keys to string values. */
const socialMediaSchema = z.record(
  z.string(),
  z.string({ error: 'Cada red social debe ser una cadena de texto' })
);

/** Business hours: trimmed, up to 500 characters. */
const businessHoursSchema = z
  .string({ error: 'Los horarios de atención deben ser una cadena de texto' })
  .trim()
  .min(1, 'Los horarios de atención no pueden estar vacíos')
  .max(500, 'Los horarios de atención no pueden superar los 500 caracteres');

// ── schemas ───────────────────────────────────────────────────────────────────

export const UpsertBusinessInfoSchema = z
  .object({
    name: businessNameSchema.optional(),
    description: descriptionSchema.optional(),
    address: addressSchema.optional(),
    phone: phoneSchema.optional(),
    socialMedia: socialMediaSchema.optional(),
    businessHours: businessHoursSchema.optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.address !== undefined ||
      data.phone !== undefined ||
      data.socialMedia !== undefined ||
      data.businessHours !== undefined,
    { message: 'Debe proporcionar al menos un campo para actualizar' }
  );

// ── inferred types ────────────────────────────────────────────────────────────

export type UpsertBusinessInfoDto = z.infer<typeof UpsertBusinessInfoSchema>;
