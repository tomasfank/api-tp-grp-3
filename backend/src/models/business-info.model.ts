import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessInfo extends Document {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  socialMedia?: Record<string, string>;
  businessHours?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessInfoSchema = new Schema<IBusinessInfo>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: undefined,
    },
    address: {
      type: String,
      maxlength: 300,
      default: undefined,
    },
    phone: {
      type: String,
      default: undefined,
    },
    socialMedia: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    businessHours: {
      type: String,
      maxlength: 500,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

export const BusinessInfo = mongoose.model<IBusinessInfo>('BusinessInfo', BusinessInfoSchema);
