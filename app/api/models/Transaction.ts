import mongoose, { Schema, Model } from "mongoose";
import { TransactionType } from "@/types";

export interface ITransaction {
  _id: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  userId: mongoose.Types.ObjectId;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ type: 1 });

const TransactionModel: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default TransactionModel;

