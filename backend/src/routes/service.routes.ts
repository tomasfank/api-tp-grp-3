import { Router } from 'express';
import { ServiceController } from '../controllers/service.controller';
import {
  validateBody,
  validateQuery,
  authMiddleware,
  roleMiddleware,
} from '../middlewares';
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  ChangeStatusSchema,
  ServiceQuerySchema,
} from '../schemas/service.schemas';

const router = Router();

// Public routes
router.get('/', validateQuery(ServiceQuerySchema), ServiceController.findAll);

// Admin-only routes (must be registered before '/:id' to avoid being shadowed)
router.get(
  '/admin/all',
  authMiddleware,
  roleMiddleware('admin'),
  validateQuery(ServiceQuerySchema),
  ServiceController.findAllAdmin
);
router.get(
  '/admin/:id',
  authMiddleware,
  roleMiddleware('admin'),
  ServiceController.findByIdAdmin
);

router.get('/:id', ServiceController.findById);

router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  validateBody(CreateServiceSchema),
  ServiceController.create
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  validateBody(UpdateServiceSchema),
  ServiceController.update
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  ServiceController.delete
);
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware('admin'),
  validateBody(ChangeStatusSchema),
  ServiceController.changeStatus
);

export default router;
