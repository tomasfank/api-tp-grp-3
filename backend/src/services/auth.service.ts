import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/user.model';
import { TokenBlacklist } from '../models/token-blacklist.model';
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '../errors';
import type { RegisterDto, UpdateProfileDto } from '../schemas/auth.schemas';

const SALT_ROUNDS = 10;
const JWT_EXPIRY_SECONDS = 24 * 60 * 60; // 24 h

// ── helpers ───────────────────────────────────────────────────────────────────

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

/**
 * Return a plain user object with the password field omitted.
 */
function omitPassword(user: InstanceType<typeof User>) {
  const obj = user.toObject();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...rest } = obj;
  return rest;
}

// ── service ───────────────────────────────────────────────────────────────────

export const AuthService = {
  /**
   * Register a new admin user.
   * Throws ConflictError if the email is already taken.
   */
  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await User.create({
        name: dto.name,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
      });
      return omitPassword(user);
    } catch (err: unknown) {
      // MongoDB duplicate key
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: unknown }).code === 11000
      ) {
        throw new ConflictError('El correo electrónico ya está en uso');
      }
      throw err;
    }
  },

  /**
   * Validate credentials and return a signed JWT.
   * Always throws a generic AuthenticationError — never reveals which field is wrong.
   */
  async login(email: string, password: string): Promise<{ token: string }> {
    const genericError = new AuthenticationError('Credenciales incorrectas');

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) throw genericError;

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) throw genericError;

    const payload = { id: String(user._id), role: user.role };
    const token = jwt.sign(payload, getJwtSecret(), {
      expiresIn: JWT_EXPIRY_SECONDS,
    });

    return { token };
  },

  /**
   * Invalidate a JWT by inserting it into the token blacklist.
   * The blacklist TTL index will auto-remove the entry once the token expires.
   */
  async logout(token: string): Promise<void> {
    let decoded: jwt.JwtPayload | null = null;

    try {
      decoded = jwt.decode(token) as jwt.JwtPayload | null;
    } catch {
      // If we can't decode, still proceed — the token is effectively invalid
    }

    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + JWT_EXPIRY_SECONDS * 1000);

    // Upsert avoids duplicate-key errors if logout is called twice
    await TokenBlacklist.updateOne(
      { token },
      { $setOnInsert: { token, expiresAt } },
      { upsert: true }
    );
  },

  /**
   * Generate a password-reset token for the given email.
   * Always returns the same shape regardless of whether the email exists,
   * to avoid revealing user existence.
   */
  async requestPasswordReset(email: string): Promise<{ resetToken: string }> {
    const resetToken = uuidv4();
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // +1 hour

    // Only update if the user exists — silently ignore otherwise
    await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { resetToken, resetTokenExp }
    );

    return { resetToken };
  },

  /**
   * Validate the reset token and update the user's password.
   * Throws AuthenticationError if the token is invalid or expired.
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const user = await User.findOne({
      resetToken,
      resetTokenExp: { $gt: new Date() },
    });

    if (!user) {
      throw new AuthenticationError('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExp: undefined,
    });
  },

  /**
   * Partially update the authenticated admin's profile.
   * Throws ValidationError if no valid fields are provided.
   * Returns updated user without the password field.
   */
  async updateProfile(
    adminId: string,
    dto: UpdateProfileDto
  ) {
    const updates: Partial<{ name: string; lastName: string; phone: string }> = {};

    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.lastName !== undefined) updates.lastName = dto.lastName;
    if (dto.phone !== undefined) updates.phone = dto.phone;

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No se proporcionaron campos válidos para actualizar');
    }

    const user = await User.findByIdAndUpdate(adminId, updates, { new: true });

    if (!user) {
      throw new AuthenticationError('Usuario no encontrado');
    }

    return omitPassword(user);
  },
};
