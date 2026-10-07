const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const path = require("path");
const voiceRoutes = require("./routes/voiceRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const simulatorRoutes = require("./routes/simulatorRoutes");
const auditRoutes = require("./routes/auditRoutes");
const authRoutes = require("./routes/authRoutes");
const workerRoutes = require("./routes/workerRoutes");
const { setupSwagger } = require("./config/swagger");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

// Static file serving for after-fix proof photos and uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Swagger Documentation
setupSwagger(app);

// Global Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Request logger
app.use((req, res, next) => {
  if (req.path !== "/health") {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "VMC AI Automated Redressal API",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/engineer", workerRoutes);
app.use("/api/simulator", simulatorRoutes);
app.use("/api/audit-logs", auditRoutes);

// Mount at root for backward compatibility
app.use("/auth", authRoutes);

// Backward compatibility routes (for existing Twilio webhooks configured to root /voice, /get-name, etc.)
app.use("/voice", voiceRoutes);
app.post("/get-name", (req, res, next) => {
  req.url = "/get-name";
  voiceRoutes(req, res, next);
});
app.post("/get-address", (req, res, next) => {
  req.url = "/get-address";
  voiceRoutes(req, res, next);
});
app.post("/get-ward", (req, res, next) => {
  req.url = "/get-ward";
  voiceRoutes(req, res, next);
});
app.post("/get-issue", (req, res, next) => {
  req.url = "/get-issue";
  voiceRoutes(req, res, next);
});
app.post("/confirm", (req, res, next) => {
  req.url = "/confirm";
  voiceRoutes(req, res, next);
});

// Backward compatibility routes for /complaints, /employees, /simulator, and /audit-logs
app.use("/complaints", complaintRoutes);
app.use("/employees", employeeRoutes);
app.use("/simulator", simulatorRoutes);
app.use("/audit-logs", auditRoutes);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
