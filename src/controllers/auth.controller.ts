import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export const AuthController = {
  /**
   * POST /api/auth/register
   * Creates a new admin account.
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   * Returns a signed JWT on valid credentials.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body.email, req.body.password);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout  [auth]
   * Invalidates the JWT sent in the Authorization header.
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // authMiddleware already validated the token — safe to extract here
      const token = req.headers.authorization!.split(' ')[1];
      await AuthService.logout(token);
      res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/forgot-password
   * Generates a password-reset token (always responds the same, regardless of email existence).
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.requestPasswordReset(req.body.email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/reset-password
   * Resets the user's password using a valid reset token.
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resetPassword(req.body.resetToken, req.body.newPassword);
      res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/auth/profile  [auth, admin]
   * Updates the authenticated admin's profile with the provided fields.
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const updated = await AuthService.updateProfile(adminId, req.body);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
};
