require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const { connectDB } = require("./src/config/db");
const { seedDefaultUsers } = require("./src/controllers/authController");

const PORT = process.env.PORT || 3000;

async function startServer() {
  // Connect to Database
  await connectDB();

  // Seed default municipal accounts if none exist
  await seedDefaultUsers();

  // Create HTTP Server
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 VMC Civic AI Server running on port ${PORT}`);
    console.log(`🌐 Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
    console.log(`📡 Mode: ${process.env.NODE_ENV || "development"}`);
    console.log(`=========================================`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log("\n🛑 Shutting down gracefully...");
    server.close(() => {
      console.log("🔒 HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer();