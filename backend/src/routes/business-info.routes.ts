import { Router } from 'express';
import { BusinessInfoController } from '../controllers/business-info.controller';
import {
  validateBody,
  authMiddleware,
  roleMiddleware,
} from '../middlewares';
import { UpsertBusinessInfoSchema } from '../schemas/business-info.schemas';

const router = Router();

// Public route
router.get('/', BusinessInfoController.get);

// Admin-only route
router.put(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  validateBody(UpsertBusinessInfoSchema),
  BusinessInfoController.upsert
);

export default router;
