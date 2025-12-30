import mongoose, { Schema, Model } from "mongoose";

export interface IHeshab {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  deposit: number;
  previousBalance: number;
  perExtra: number;
  totalExpense: number;
  currentBalance: number;
  due: number;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const HeshabSchema = new Schema<IHeshab>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    previousBalance: {
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
    currentBalance: {
      type: Number,
      default: 0,
    },
    due: {
      type: Number,
      default: 0,
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
  },
  {
    timestamps: true,
  }
);

// Indexes
HeshabSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
HeshabSchema.index({ month: 1, year: 1 });

const HeshabModel: Model<IHeshab> =
  mongoose.models.Heshab || mongoose.model<IHeshab>("Heshab", HeshabSchema);

export default HeshabModel;

