import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IService extends Document {
  name: string;
  category: Types.ObjectId;
  description: string;
  images: string[];
  price?: number;
  availabilityStatus: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => arr.length >= 1 && arr.length <= 10,
        message: 'images must contain between 1 and 10 URLs',
      },
    },
    price: {
      type: Number,
      min: 0,
      default: undefined,
    },
    availabilityStatus: {
      type: String,
      enum: ['active', 'inactive'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index on category for efficient filtering by category
ServiceSchema.index({ category: 1 });

// Index on availabilityStatus for efficient filtering of active/inactive services
ServiceSchema.index({ availabilityStatus: 1 });

// Full-text index on name and description for $text search (case-insensitive)
ServiceSchema.index({ name: 'text', description: 'text' });

export const Service = mongoose.model<IService>('Service', ServiceSchema);
