import mongoose, { Schema, Model } from "mongoose";

export interface IDailyExtra {
  _id: mongoose.Types.ObjectId;
  reason: string;
  amount: number;
  date: Date;
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DailyExtraSchema = new Schema<IDailyExtra>(
  {
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DailyExtraSchema.index({ date: 1 });
DailyExtraSchema.index({ addedBy: 1 });

const DailyExtraModel: Model<IDailyExtra> =
  mongoose.models.DailyExtra || mongoose.model<IDailyExtra>("DailyExtra", DailyExtraSchema);

export default DailyExtraModel;

