import { Request, Response, NextFunction } from 'express';
import { CategoryRepository } from '../repositories/category.repository';

export const CategoryController = {
  /**
   * GET /api/categories
   * Lists all categories ordered alphabetically (public).
   */
  async findAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryRepository.findAll();
      res.status(200).json(categories);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/categories  [auth, admin]
   * Creates a new category.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CategoryRepository.create(req.body);
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/categories/:id  [auth, admin]
   * Updates an existing category's name.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CategoryRepository.update(req.params.id as string, req.body);
      res.status(200).json(category);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/categories/:id  [auth, admin]
   * Permanently deletes a category (only if no service references it).
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await CategoryRepository.delete(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
