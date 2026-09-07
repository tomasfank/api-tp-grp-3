import { Category, ICategory } from '../models/category.model';
import { Service } from '../models/service.model';
import { ConflictError, NotFoundError } from '../errors';
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../schemas/category.schemas';

// Collation used across queries so name comparisons/ordering ignore case & accents,
// matching the unique index defined on the Category model.
const CI_COLLATION = { locale: 'en', strength: 2 } as const;

/**
 * Type guard for MongoDB duplicate-key errors (E11000).
 */
function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  );
}

export const CategoryRepository = {
  /**
   * Create a category.
   * Throws ConflictError if the name is already in use (case-insensitive).
   */
  async create(dto: CreateCategoryDto): Promise<ICategory> {
    try {
      const category = await Category.create({ name: dto.name });
      return category;
    } catch (err: unknown) {
      if (isDuplicateKeyError(err)) {
        throw new ConflictError('El nombre de categoría ya está en uso');
      }
      throw err;
    }
  },

  /**
   * Update a category's name.
   * Verifies case-insensitive uniqueness excluding the same document.
   * Throws ConflictError on duplicate name, NotFoundError if the id does not exist.
   */
  async update(id: string, dto: UpdateCategoryDto): Promise<ICategory> {
    // Ensure the category exists first.
    const existing = await Category.findById(id);
    if (!existing) {
      throw new NotFoundError('Categoría no encontrada');
    }

    // Case-insensitive uniqueness check excluding the current document.
    const duplicate = await Category.findOne({
      _id: { $ne: id },
      name: dto.name,
    }).collation(CI_COLLATION);

    if (duplicate) {
      throw new ConflictError('El nombre de categoría ya está en uso');
    }

    existing.name = dto.name;

    try {
      await existing.save();
      return existing;
    } catch (err: unknown) {
      // Guard against race conditions where the unique index rejects the write.
      if (isDuplicateKeyError(err)) {
        throw new ConflictError('El nombre de categoría ya está en uso');
      }
      throw err;
    }
  },

  /**
   * Permanently delete a category.
   * Throws ConflictError if any Service references it.
   * Throws NotFoundError if the id does not exist.
   */
  async delete(id: string): Promise<void> {
    const existing = await Category.findById(id);
    if (!existing) {
      throw new NotFoundError('Categoría no encontrada');
    }

    const referencingService = await Service.exists({ category: id });
    if (referencingService) {
      throw new ConflictError(
        'La categoría está en uso por uno o más servicios y no puede eliminarse'
      );
    }

    await Category.findByIdAndDelete(id);
  },

  /**
   * List all categories ordered alphabetically by name (case-insensitive).
   */
  async findAll(): Promise<ICategory[]> {
    return Category.find()
      .collation(CI_COLLATION)
      .sort({ name: 1 });
  },
};
