import mongoose, { Schema, Model } from "mongoose";

export interface IMember {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  totalDeposit: number;
  previousDue: number;
  perExtra: number;
  totalExpense: number;
  balanceDue: number;
  border: number;
  managerReceivable: number;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    previousDue: {
      type: Number,
      default: 0,
    },
    perExtra: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalExpense: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    border: {
      type: Number,
      default: 0,
      min: 0,
    },
    managerReceivable: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Note: Index is automatically created by unique: true on userId, so we don't need to add it manually

const MemberModel: Model<IMember> =
  mongoose.models.Member || mongoose.model<IMember>("Member", MemberSchema);

export default MemberModel;

