import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Invitation code required to register a new admin user.
 *
 * Codes have no expiration and no usage limit: if a code exists in the
 * collection, it can be used to register any number of accounts.
 */
export interface IInvitationCode extends Document {
  code: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invitationCodeSchema = new Schema<IInvitationCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

export const InvitationCode: Model<IInvitationCode> = mongoose.model<IInvitationCode>(
  'InvitationCode',
  invitationCodeSchema
);
