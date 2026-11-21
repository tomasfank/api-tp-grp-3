import { Contact, IContact, ContactStatus } from '../models/contact.model';
import { Types } from 'mongoose';
import { ConflictError, NotFoundError, ValidationError } from '../errors';
import type {
  CreateContactDto,
  UpdateContactStatusDto,
  ReplyContactDto,
  ContactQueryDto,
} from '../schemas/contact.schemas';

/**
 * Statuses an admin can set manually. 'answered' is excluded on purpose:
 * a contact only becomes 'answered' through reply().
 */
const MANUAL_STATUSES: readonly ContactStatus[] = ['pending', 'read'];

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
   * Update a contact's status (only 'pending' or 'read').
   * Throws ValidationError if the status is not a manually assignable value.
   * Throws NotFoundError if the id does not exist.
   * Throws ConflictError if the contact was already answered.
   */
  async updateStatus(
    id: string,
    status: UpdateContactStatusDto['status']
  ): Promise<IContact> {
    if (!MANUAL_STATUSES.includes(status)) {
      throw new ValidationError('El estado proporcionado no es válido');
    }

    const existing = await Contact.findById(id);
    if (!existing) {
      throw new NotFoundError('Contacto no encontrado');
    }

    if (existing.status === 'answered') {
      throw new ConflictError(
        'La consulta ya fue respondida y su estado no puede modificarse'
      );
    }

    existing.status = status;
    await existing.save();
    return existing;
  },

  /**
   * Reply to a contact (simulated: the reply is persisted, not emailed).
   * Stores the reply and moves the contact to status 'answered'.
   * Throws NotFoundError if the id does not exist.
   * Throws ConflictError if the contact was already answered.
   */
  async reply(
    id: string,
    message: ReplyContactDto['message'],
    adminId?: string
  ): Promise<IContact> {
    const existing = await Contact.findById(id);
    if (!existing) {
      throw new NotFoundError('Contacto no encontrado');
    }

    if (existing.status === 'answered') {
      throw new ConflictError('La consulta ya fue respondida');
    }

    existing.reply = {
      message,
      answeredAt: new Date(),
      answeredBy:
        adminId && Types.ObjectId.isValid(adminId)
          ? new Types.ObjectId(adminId)
          : null,
    };
    existing.status = 'answered';
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
