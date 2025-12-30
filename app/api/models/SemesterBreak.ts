import mongoose, { Schema, Model } from "mongoose";

export interface ISemesterBreak {
  _id: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const SemesterBreakSchema = new Schema<ISemesterBreak>(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
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
SemesterBreakSchema.index({ startDate: 1, endDate: 1 });

const SemesterBreakModel: Model<ISemesterBreak> =
  mongoose.models.SemesterBreak ||
  mongoose.model<ISemesterBreak>("SemesterBreak", SemesterBreakSchema);

export default SemesterBreakModel;

