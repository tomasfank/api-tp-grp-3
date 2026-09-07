import { Request, Response, NextFunction } from 'express';
import { ServiceRepository } from '../repositories/service.repository';

export const ServiceController = {
  /**
   * GET /api/services
   * Lists only active services with pagination, filters and search (public).
   * `req.query` is already validated/coerced by validateQuery(ServiceQuerySchema).
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ServiceRepository.findAll(req.query as never);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/services/:id
   * Returns a single active service by id (public).
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServiceRepository.findById(req.params.id as string);
      res.status(200).json(service);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/services  [auth, admin]
   * Creates a new service.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServiceRepository.create(req.body);
      res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/services/:id  [auth, admin]
   * Updates only the provided fields of an existing service.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServiceRepository.update(req.params.id as string, req.body);
      res.status(200).json(service);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/services/:id  [auth, admin]
   * Permanently deletes a service.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ServiceRepository.delete(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/services/:id/status  [auth, admin]
   * Updates only the availabilityStatus of a service.
   */
  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServiceRepository.changeStatus(req.params.id as string, req.body);
      res.status(200).json(service);
    } catch (err) {
      next(err);
    }
  },
};
