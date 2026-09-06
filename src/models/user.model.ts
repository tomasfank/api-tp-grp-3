import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'admin';
  resetToken?: string;
  resetTokenExp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: undefined,
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
    },
    resetToken: {
      type: String,
      default: undefined,
    },
    resetTokenExp: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on email (already handled by unique: true in schema, but explicit for clarity)
UserSchema.index({ email: 1 }, { unique: true });

// Sparse index on resetToken — only indexes documents where the field exists
UserSchema.index({ resetToken: 1 }, { sparse: true });

export const User = mongoose.model<IUser>('User', UserSchema);
