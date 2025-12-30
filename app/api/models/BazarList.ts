import mongoose, { Schema, Model } from "mongoose";
import { BazarStatus } from "@/types";

export interface IBazarList {
  _id: mongoose.Types.ObjectId;
  bazarNo: number;
  date: Date;
  assignedTo: mongoose.Types.ObjectId;
  status: BazarStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BazarListSchema = new Schema<IBazarList>(
  {
    bazarNo: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BazarStatus),
      default: BazarStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BazarListSchema.index({ date: -1 });
BazarListSchema.index({ assignedTo: 1 });
BazarListSchema.index({ bazarNo: 1 });
// Unique index to prevent same person being assigned twice on the same date
BazarListSchema.index({ date: 1, assignedTo: 1 }, { unique: true });

const BazarListModel: Model<IBazarList> =
  mongoose.models.BazarList || mongoose.model<IBazarList>("BazarList", BazarListSchema);

export default BazarListModel;

