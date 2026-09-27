import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { validateBody } from '../middlewares';
import { CreateContactSchema } from '../schemas/contact.schemas';

const router = Router();

// Public route
router.post('/', validateBody(CreateContactSchema), ContactController.create);

export default router;
