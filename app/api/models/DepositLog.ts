import mongoose, { Schema, Model } from "mongoose";

export interface IDepositLog {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  heshabId?: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  month: number;
  year: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepositLogSchema = new Schema<IDepositLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    heshabId: {
      type: Schema.Types.ObjectId,
      ref: "Heshab",
      required: false,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2020,
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
DepositLogSchema.index({ userId: 1, month: 1, year: 1 });
DepositLogSchema.index({ heshabId: 1 });
DepositLogSchema.index({ date: -1 });

const DepositLogModel: Model<IDepositLog> =
  mongoose.models.DepositLog || mongoose.model<IDepositLog>("DepositLog", DepositLogSchema);

export default DepositLogModel;

