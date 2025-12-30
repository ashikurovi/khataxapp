import mongoose, { Schema, Model } from "mongoose";

export interface IDailyExpense {
  _id: mongoose.Types.ObjectId;
  date: Date;
  addedBy?: mongoose.Types.ObjectId | null;
  bazarShop: string;
  bazarListUpload: string;
  totalTK: number;
  extra: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyExpenseSchema = new Schema<IDailyExpense>(
  {
    date: {
      type: Date,
      required: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      required: false,
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
  },
  {
    timestamps: true,
  }
);

// Indexes
DailyExpenseSchema.index({ date: -1 });
DailyExpenseSchema.index({ addedBy: 1 }, { sparse: true }); // Sparse index allows null values

// Pre-save hook to ensure addedBy is never required
DailyExpenseSchema.pre('save', function() {
  // If addedBy is undefined, set it to null
  if (this.addedBy === undefined) {
    this.addedBy = null;
  }
});

const DailyExpenseModel: Model<IDailyExpense> =
  mongoose.models.DailyExpense ||
  mongoose.model<IDailyExpense>("DailyExpense", DailyExpenseSchema);

export default DailyExpenseModel;

