import mongoose from "mongoose";

export async function connectMongo(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("[mongo] MONGODB_URI not set, skipping connection");
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("[mongo] connected");
  } catch (err) {
    console.error("[mongo] connection failed", err);
  }
}