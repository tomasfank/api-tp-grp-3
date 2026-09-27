import mongoose, { Document, Schema } from 'mongoose';

export type ContactStatus = 'pending' | 'read' | 'answered';

export interface IContact extends Document {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 5000,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'read', 'answered'],
      required: true,
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index on status for filtering by contact state
ContactSchema.index({ status: 1 });

// Descending index on createdAt for efficient pagination sorted by newest first
ContactSchema.index({ createdAt: -1 });

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);
