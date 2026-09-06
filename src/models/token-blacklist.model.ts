import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITokenBlacklist extends Document {
  token: string;
  expiresAt: Date;
}

const tokenBlacklistSchema = new Schema<ITokenBlacklist>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: MongoDB deletes the document at the exact expiresAt time
    },
  },
  {
    timestamps: false,
  }
);

export const TokenBlacklist: Model<ITokenBlacklist> = mongoose.model<ITokenBlacklist>(
  'TokenBlacklist',
  tokenBlacklistSchema
);
