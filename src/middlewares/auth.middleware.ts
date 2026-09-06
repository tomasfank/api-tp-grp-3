import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenBlacklist } from '../models/token-blacklist.model';
import { AuthenticationError, AuthorizationError } from '../errors';

// ── helpers ───────────────────────────────────────────────────────────────────

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1] ?? null;
}

// ── authMiddleware ────────────────────────────────────────────────────────────

/**
 * Verifies the JWT in the `Authorization: Bearer <token>` header.
 * Checks the token against the blacklist.
 * Attaches `req.user = { id, role }` on success.
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return next(new AuthenticationError('Token de autenticación requerido'));
    }

    // Verify signature and expiry
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    } catch {
      return next(new AuthenticationError('Token inválido o expirado'));
    }

    // Check blacklist
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      return next(new AuthenticationError('Token inválido o expirado'));
    }

    // Attach user info
    req.user = {
      id: payload['id'] as string,
      role: payload['role'] as string,
    };

    next();
  } catch (err) {
    next(err);
  }
}

// ── roleMiddleware ────────────────────────────────────────────────────────────

/**
 * Factory that returns a middleware enforcing a specific role.
 * Must be used after `authMiddleware` (which sets `req.user`).
 */
export function roleMiddleware(requiredRole: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== requiredRole) {
      return next(new AuthorizationError('Permisos insuficientes'));
    }
    next();
  };
}
