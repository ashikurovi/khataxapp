import mongoose, { Schema, Model } from "mongoose";

export interface IDailyExpense {
  _id: mongoose.Types.ObjectId;
  date: Date;
  bazarShop: string;
  bazarListUpload: string;
  totalTK: number;
  extra: number;
  notes: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DailyExpenseSchema = new Schema<IDailyExpense>(
  {
    date: {
      type: Date,
      required: true,
    },
    bazarShop: {
      type: String,
      required: true,
      trim: true,
    },
    bazarListUpload: {
      type: String,
      default: "",
    },
    totalTK: {
      type: Number,
      required: true,
      min: 0,
    },
    extra: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DailyExpenseSchema.index({ date: -1 });

const DailyExpenseModel: Model<IDailyExpense> =
  mongoose.models.DailyExpense ||
  mongoose.model<IDailyExpense>("DailyExpense", DailyExpenseSchema);

export default DailyExpenseModel;
