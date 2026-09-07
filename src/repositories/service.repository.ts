import { Service, IService } from '../models/service.model';
import { Category } from '../models/category.model';
import { ConflictError, NotFoundError } from '../errors';
import type {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceQueryDto,
  ChangeStatusDto,
} from '../schemas/service.schemas';

/**
 * Paginated result returned by {@link ServiceRepository.findAll}.
 */
export interface ServiceListResult {
  data: IService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Ensure the referenced category exists.
 * Throws ConflictError if the category id does not correspond to any document.
 */
async function assertCategoryExists(categoryId: string): Promise<void> {
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) {
    throw new ConflictError('La categoría referenciada no es válida');
  }
}

export const ServiceRepository = {
  /**
   * Create a service.
   * Validates that the referenced category exists (ConflictError if not).
   */
  async create(dto: CreateServiceDto): Promise<IService> {
    await assertCategoryExists(dto.category);
    const service = await Service.create({
      name: dto.name,
      category: dto.category,
      description: dto.description,
      images: dto.images,
      availabilityStatus: dto.availabilityStatus,
      price: dto.price,
    });
    return service;
  },

  /**
   * Update only the fields present in the dto.
   * If `category` is included, validates it exists (ConflictError if not).
   * Throws NotFoundError if the id does not exist.
   */
  async update(id: string, dto: UpdateServiceDto): Promise<IService> {
    const existing = await Service.findById(id);
    if (!existing) {
      throw new NotFoundError('Servicio no encontrado');
    }

    if (dto.category !== undefined) {
      await assertCategoryExists(dto.category);
    }

    if (dto.name !== undefined) existing.name = dto.name;
    if (dto.category !== undefined) {
      existing.category = dto.category as unknown as IService['category'];
    }
    if (dto.description !== undefined) existing.description = dto.description;
    if (dto.images !== undefined) existing.images = dto.images;
    if (dto.availabilityStatus !== undefined) {
      existing.availabilityStatus = dto.availabilityStatus;
    }
    if (dto.price !== undefined) existing.price = dto.price;

    await existing.save();
    return existing;
  },

  /**
   * Permanently delete a service.
   * Throws NotFoundError if the id does not exist.
   */
  async delete(id: string): Promise<void> {
    const deleted = await Service.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundError('Servicio no encontrado');
    }
  },

  /**
   * Update only the `availabilityStatus` field.
   * Throws NotFoundError if the id does not exist.
   */
  async changeStatus(id: string, status: ChangeStatusDto): Promise<IService> {
    const updated = await Service.findByIdAndUpdate(
      id,
      { availabilityStatus: status.availabilityStatus },
      { new: true }
    );
    if (!updated) {
      throw new NotFoundError('Servicio no encontrado');
    }
    return updated;
  },

  /**
   * List only `active` services, sorted by name ascending, with pagination and filters.
   * Supports `$text` case-insensitive search across `name` and `description`.
   * If filtering by category, validates the category exists (NotFoundError if not).
   * Returns the page data along with pagination metadata.
   */
  async findAll(filters: ServiceQueryDto): Promise<ServiceListResult> {
    const { page, limit, category, search } = filters;

    const query: Record<string, unknown> = { availabilityStatus: 'active' };

    if (category !== undefined) {
      const exists = await Category.exists({ _id: category });
      if (!exists) {
        throw new NotFoundError('Categoría no encontrada');
      }
      query.category = category;
    }

    if (search !== undefined) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Service.find(query).sort({ name: 1 }).skip(skip).limit(limit),
      Service.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  },

  /**
   * Return an `active` service by id.
   * Throws NotFoundError if not found OR if it is `inactive`.
   */
  async findById(id: string): Promise<IService> {
    const service = await Service.findOne({
      _id: id,
      availabilityStatus: 'active',
    });
    if (!service) {
      throw new NotFoundError('Servicio no encontrado');
    }
    return service;
  },
};
