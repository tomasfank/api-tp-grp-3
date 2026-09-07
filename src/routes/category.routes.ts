import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import {
  validateBody,
  authMiddleware,
  roleMiddleware,
} from '../middlewares';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from '../schemas/category.schemas';

const router = Router();

// Public route
router.get('/', CategoryController.findAll);

// Admin-only routes
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  validateBody(CreateCategorySchema),
  CategoryController.create
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  validateBody(UpdateCategorySchema),
  CategoryController.update
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  CategoryController.delete
);

export default router;
