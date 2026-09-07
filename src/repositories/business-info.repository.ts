import { BusinessInfo, IBusinessInfo } from '../models/business-info.model';
import { NotFoundError, ValidationError } from '../errors';
import type { UpsertBusinessInfoDto } from '../schemas/business-info.schemas';

// BusinessInfo is a singleton: a single document holds the site's business
// information. An empty filter always targets that one document.
const SINGLETON_FILTER = {} as const;

/**
 * Fields that may be set on the BusinessInfo singleton via upsert.
 */
const UPDATABLE_FIELDS: readonly (keyof UpsertBusinessInfoDto)[] = [
  'name',
  'description',
  'address',
  'phone',
  'socialMedia',
  'businessHours',
];

export const BusinessInfoRepository = {
  /**
   * Create or update the single BusinessInfo document.
   * Only the fields present in the DTO are applied.
   * Throws ValidationError if no valid fields are provided.
   */
  async upsert(dto: UpsertBusinessInfoDto): Promise<IBusinessInfo> {
    const update: Partial<UpsertBusinessInfoDto> = {};
    for (const field of UPDATABLE_FIELDS) {
      const value = dto[field];
      if (value !== undefined) {
        (update as Record<string, unknown>)[field] = value;
      }
    }

    if (Object.keys(update).length === 0) {
      throw new ValidationError('Debe proporcionar al menos un campo para actualizar');
    }

    const document = await BusinessInfo.findOneAndUpdate(
      SINGLETON_FILTER,
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return document as IBusinessInfo;
  },

  /**
   * Return the current BusinessInfo document.
   * Throws NotFoundError if none exists.
   */
  async get(): Promise<IBusinessInfo> {
    const document = await BusinessInfo.findOne(SINGLETON_FILTER);
    if (!document) {
      throw new NotFoundError('La información del negocio no ha sido configurada');
    }
    return document;
  },
};
