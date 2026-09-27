import { Request, Response, NextFunction } from 'express';
import { ContactRepository } from '../repositories/contact.repository';

export const ContactController = {
  /**
   * POST /api/contacts
   * Creates a new contact message (public). Persisted with status 'pending'.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await ContactRepository.create(req.body);
      res.status(201).json(contact);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/contacts  [auth, admin]
   * Lists contacts sorted by createdAt descending, with pagination metadata.
   * `req.query` is already validated/coerced by validateQuery(ContactQuerySchema).
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ContactRepository.findAll(req.query as never);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/contacts/:id/status  [auth, admin]
   * Updates only the status of a contact message.
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await ContactRepository.updateStatus(
        req.params.id as string,
        req.body.status
      );
      res.status(200).json(contact);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/contacts/:id  [auth, admin]
   * Permanently deletes a contact message.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ContactRepository.delete(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
