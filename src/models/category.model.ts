import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index with case-insensitive collation (strength: 2 ignores case and accents)
CategorySchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
