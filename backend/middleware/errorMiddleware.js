/**
 * Global Error Handling & 404 Route Middleware
 */

function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    error: `API Route Not Found: [${req.method}] ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  console.error("❌ [API Error]:", err.stack || err.message);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
}

module.exports = {
  notFound,
  errorHandler
};
