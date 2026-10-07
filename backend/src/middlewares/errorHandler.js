// Centralized Error Handling Middleware
function errorHandler(err, req, res, next) {
  console.error("💥 [Error Handler]:", err.stack || err.message);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = { errorHandler };
