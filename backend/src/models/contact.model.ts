import mongoose, { Document, Schema, Types } from 'mongoose';

export type ContactStatus = 'pending' | 'read' | 'answered';

/** Admin reply to a contact message. Simulated: stored only, never emailed. */
export interface IContactReply {
  message: string;
  answeredAt: Date;
  answeredBy: Types.ObjectId | null;
}

export interface IContact extends Document {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  reply: IContactReply | null;
  createdAt: Date;
  updatedAt: Date;
}

const ContactReplySchema = new Schema<IContactReply>(
  {
    message: {
      type: String,
      required: true,
      maxlength: 5000,
      trim: true,
    },
    answeredAt: {
      type: Date,
      required: true,
    },
    answeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false }
);

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
    reply: {
      type: ContactReplySchema,
      default: null,
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
