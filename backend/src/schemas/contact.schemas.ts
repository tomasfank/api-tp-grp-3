import { z } from 'zod';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Contact name: trimmed, between 1 and 100 characters. */
const contactNameSchema = z
  .string({ error: 'El nombre es requerido' })
  .trim()
  .min(1, 'El nombre es requerido')
  .max(100, 'El nombre no puede superar los 100 caracteres');

/** Email: RFC 5322 format. */
const emailSchema = z.email('El formato del correo electrónico no es válido');

/** Phone: optional, 7-15 numeric digits. */
const phoneSchema = z
  .string()
  .regex(/^\d{7,15}$/, 'El teléfono debe contener entre 7 y 15 dígitos numéricos')
  .optional();

/** Subject: trimmed, between 1 and 200 characters. */
const subjectSchema = z
  .string({ error: 'El asunto es requerido' })
  .trim()
  .min(1, 'El asunto es requerido')
  .max(200, 'El asunto no puede superar los 200 caracteres');

/** Message: trimmed, between 1 and 5000 characters. */
const messageSchema = z
  .string({ error: 'El mensaje es requerido' })
  .trim()
  .min(1, 'El mensaje es requerido')
  .max(5000, 'El mensaje no puede superar los 5000 caracteres');

/**
 * Status an admin can set manually: 'pending' or 'read'.
 * 'answered' is only reachable by replying (POST /api/admin/contacts/:id/reply).
 */
const contactStatusSchema = z.enum(['pending', 'read'], {
  error:
    'El estado debe ser "pending" o "read". Para marcar como respondida, enviá una respuesta',
});

/** Admin reply: trimmed, between 1 and 5000 characters. */
const replyMessageSchema = z
  .string({ error: 'La respuesta es requerida' })
  .trim()
  .min(1, 'La respuesta es requerida')
  .max(5000, 'La respuesta no puede superar los 5000 caracteres');

// ── schemas ───────────────────────────────────────────────────────────────────

export const CreateContactSchema = z.object({
  name: contactNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  subject: subjectSchema,
  message: messageSchema,
});

export const UpdateContactStatusSchema = z.object({
  status: contactStatusSchema,
});

export const ReplyContactSchema = z.object({
  message: replyMessageSchema,
});

export const ContactQuerySchema = z.object({
  page: z.coerce
    .number('La página debe ser un número')
    .int('La página debe ser un número entero')
    .min(1, 'La página debe ser mayor o igual a 1')
    .default(1),
  pageSize: z.coerce
    .number('El tamaño de página debe ser un número')
    .int('El tamaño de página debe ser un número entero')
    .min(1, 'El tamaño de página debe ser mayor o igual a 1')
    .max(100, 'El tamaño de página no puede superar 100')
    .default(20),
});

// ── inferred types ────────────────────────────────────────────────────────────

export type CreateContactDto = z.infer<typeof CreateContactSchema>;
export type UpdateContactStatusDto = z.infer<typeof UpdateContactStatusSchema>;
export type ReplyContactDto = z.infer<typeof ReplyContactSchema>;
export type ContactQueryDto = z.infer<typeof ContactQuerySchema>;
