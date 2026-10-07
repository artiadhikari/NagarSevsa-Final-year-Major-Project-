const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/vmc_complaints";

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
}

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("⚠ MongoDB disconnected. Attempting reconnect...");
});

module.exports = { connectDB };
