import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import {
  validateBody,
  authMiddleware,
  roleMiddleware,
} from '../middlewares';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdateProfileSchema,
} from '../schemas/auth.schemas';

const router = Router();

// Public routes
router.post('/register', validateBody(RegisterSchema), AuthController.register);
router.post('/login', validateBody(LoginSchema), AuthController.login);
router.post('/forgot-password', validateBody(ForgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validateBody(ResetPasswordSchema), AuthController.resetPassword);

// Authenticated routes
router.post('/logout', authMiddleware, AuthController.logout);
router.put(
  '/profile',
  authMiddleware,
  roleMiddleware('admin'),
  validateBody(UpdateProfileSchema),
  AuthController.updateProfile
);

export default router;
