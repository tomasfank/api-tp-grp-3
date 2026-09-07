import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import {
  validateBody,
  validateQuery,
  authMiddleware,
  roleMiddleware,
} from '../middlewares';
import {
  UpdateContactStatusSchema,
  ContactQuerySchema,
} from '../schemas/contact.schemas';

const router = Router();

// Admin-only routes
router.get(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  validateQuery(ContactQuerySchema),
  ContactController.findAll
);
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware('admin'),
  validateBody(UpdateContactStatusSchema),
  ContactController.updateStatus
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  ContactController.delete
);

export default router;
