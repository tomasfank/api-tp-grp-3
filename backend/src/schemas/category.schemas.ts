import { z } from 'zod';

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Category name: trimmed length between 1 and 100 characters, must contain at
 * least one non-whitespace character (whitespace-only values are rejected).
 */
const categoryNameSchema = z
  .string({ error: 'El nombre es requerido' })
  .trim()
  .min(1, 'El nombre es requerido')
  .max(100, 'El nombre no puede superar los 100 caracteres');

// ── schemas ───────────────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: categoryNameSchema,
});

export const UpdateCategorySchema = z.object({
  name: categoryNameSchema,
});

// ── inferred types ────────────────────────────────────────────────────────────

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
