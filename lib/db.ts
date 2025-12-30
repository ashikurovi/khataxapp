// lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://ashikurovi2003_db_user:QTZWgecg4WqSGAhZ@khatax.e3wlz9p.mongodb.net/?appName=khatax";

declare global {
  var _mongooseConn:
    | {
        conn: mongoose.Mongoose | null;
        promise: Promise<mongoose.Mongoose> | null;
        indexesSynced: boolean;
      }
    | undefined;
}

let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = {
    conn: null,
    promise: null,
    indexesSynced: false,
  };
}

async function connectDB(): Promise<mongoose.Mongoose> {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    cached!.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => {
        console.log("✅ MongoDB connected");
        return m;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        throw err;
      });
  }

  cached!.conn = await cached!.promise;

  // Index sync placeholder (safe)
  if (!cached!.indexesSynced) {
    try {
      // await SomeModel.syncIndexes();
      cached!.indexesSynced = true;
    } catch {
      // Ignore index sync errors
    }
  }

  return cached!.conn;
}

export default connectDB;
