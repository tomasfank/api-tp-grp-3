import { z } from 'zod';

// ── helpers ──────────────────────────────────────────────────────────────────

/** MongoDB ObjectId: 24 hexadecimal characters. */
const objectIdSchema = z
  .string({ error: 'El identificador es requerido' })
  .regex(/^[0-9a-fA-F]{24}$/, 'El identificador no es un ObjectId válido');

/** Service name: trimmed, between 1 and 100 characters. */
const serviceNameSchema = z
  .string({ error: 'El nombre es requerido' })
  .trim()
  .min(1, 'El nombre es requerido')
  .max(100, 'El nombre no puede superar los 100 caracteres');

/** Service description: trimmed, between 1 and 2000 characters. */
const serviceDescriptionSchema = z
  .string({ error: 'La descripción es requerida' })
  .trim()
  .min(1, 'La descripción es requerida')
  .max(2000, 'La descripción no puede superar los 2000 caracteres');

/** Images: array of 1-10 valid URLs. */
const imagesSchema = z
  .array(z.url('Cada imagen debe ser una URL válida'))
  .min(1, 'Debe proporcionar al menos 1 imagen')
  .max(10, 'No puede proporcionar más de 10 imágenes');

/** Availability status: 'active' or 'inactive'. */
const availabilityStatusSchema = z.enum(['active', 'inactive'], {
  error: 'El estado debe ser "active" o "inactive"',
});

/** Price: positive number, optional. */
const priceSchema = z
  .number('El precio debe ser un número')
  .positive('El precio debe ser un número positivo')
  .optional();

// ── schemas ───────────────────────────────────────────────────────────────────

export const CreateServiceSchema = z.object({
  name: serviceNameSchema,
  category: objectIdSchema,
  description: serviceDescriptionSchema,
  images: imagesSchema,
  availabilityStatus: availabilityStatusSchema,
  price: priceSchema,
});

export const UpdateServiceSchema = z
  .object({
    name: serviceNameSchema.optional(),
    category: objectIdSchema.optional(),
    description: serviceDescriptionSchema.optional(),
    images: imagesSchema.optional(),
    availabilityStatus: availabilityStatusSchema.optional(),
    price: priceSchema,
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.category !== undefined ||
      data.description !== undefined ||
      data.images !== undefined ||
      data.availabilityStatus !== undefined ||
      data.price !== undefined,
    { message: 'Debe proporcionar al menos un campo para actualizar' }
  );

export const ChangeStatusSchema = z.object({
  availabilityStatus: availabilityStatusSchema,
});

export const ServiceQuerySchema = z.object({
  page: z.coerce
    .number('La página debe ser un número')
    .int('La página debe ser un número entero')
    .min(1, 'La página debe ser mayor o igual a 1')
    .default(1),
  limit: z.coerce
    .number('El límite debe ser un número')
    .int('El límite debe ser un número entero')
    .min(1, 'El límite debe ser mayor o igual a 1')
    .max(100, 'El límite no puede superar 100')
    .default(10),
  category: objectIdSchema.optional(),
  search: z.string().min(1, 'El término de búsqueda debe tener al menos 1 carácter').optional(),
});

// ── inferred types ────────────────────────────────────────────────────────────

export type CreateServiceDto = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceDto = z.infer<typeof UpdateServiceSchema>;
export type ChangeStatusDto = z.infer<typeof ChangeStatusSchema>;
export type ServiceQueryDto = z.infer<typeof ServiceQuerySchema>;
