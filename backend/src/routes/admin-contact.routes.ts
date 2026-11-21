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
  ReplyContactSchema,
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
router.post(
  '/:id/reply',
  authMiddleware,
  roleMiddleware('admin'),
  validateBody(ReplyContactSchema),
  ContactController.reply
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  ContactController.delete
);

export default router;
