import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("Missing MONGO_URI environment variable");
    // In serverless, prefer throwing instead of process.exit
    throw new Error("Missing MONGO_URI environment variable");
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    // Throw so Vercel logs the error; avoid process.exit in functions
    throw error;
  }
};

export default connectDB;
