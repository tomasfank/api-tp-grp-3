import { Contact, IContact, ContactStatus } from '../models/contact.model';
import { NotFoundError, ValidationError } from '../errors';
import type {
  CreateContactDto,
  UpdateContactStatusDto,
  ContactQueryDto,
} from '../schemas/contact.schemas';

/** Valid contact statuses, mirroring the enum defined on the Contact model. */
const VALID_STATUSES: readonly ContactStatus[] = [
  'pending',
  'read',
  'answered',
];

/** Paginated result shape returned by findAll. */
export interface PaginatedContacts {
  data: IContact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const ContactRepository = {
  /**
   * Create a contact message.
   * Persists with status 'pending'. When phone is not provided, stores null explicitly.
   */
  async create(dto: CreateContactDto): Promise<IContact> {
    const contact = await Contact.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      subject: dto.subject,
      message: dto.message,
      status: 'pending',
    });
    return contact;
  },

  /**
   * List contacts sorted by createdAt descending, with pagination metadata.
   */
  async findAll(pagination: ContactQueryDto): Promise<PaginatedContacts> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      Contact.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Contact.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return { data, total, page, pageSize, totalPages };
  },

  /**
   * Update a contact's status.
   * Throws ValidationError if the status is not a valid value.
   * Throws NotFoundError if the id does not exist.
   */
  async updateStatus(
    id: string,
    status: UpdateContactStatusDto['status']
  ): Promise<IContact> {
    if (!VALID_STATUSES.includes(status)) {
      throw new ValidationError('El estado proporcionado no es válido');
    }

    const existing = await Contact.findById(id);
    if (!existing) {
      throw new NotFoundError('Contacto no encontrado');
    }

    existing.status = status;
    await existing.save();
    return existing;
  },

  /**
   * Permanently delete a contact.
   * Throws NotFoundError if the id does not exist.
   */
  async delete(id: string): Promise<void> {
    const existing = await Contact.findById(id);
    if (!existing) {
      throw new NotFoundError('Contacto no encontrado');
    }

    await Contact.findByIdAndDelete(id);
  },
};
