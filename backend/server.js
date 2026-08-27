/**
 * ParkWise Enterprise Smart Parking System — Backend Server
 * Architecture: Node.js · Express · MongoDB / Resilient In-Memory Datastore
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");

const { connectDB, getDatabaseStatus } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const parkingRoutes = require("./routes/parkingRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const gateRoutes = require("./routes/gateRoutes");
const statsRoutes = require("./routes/statsRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Gate Simulator & Static Assets
app.use(express.static(path.join(__dirname, "public")));

// Initialize Database (Auto-detects MongoDB or falls back to In-Memory Engine)
connectDB();

// API Routes
app.use("/api", authRoutes);
app.use("/api", parkingRoutes);
app.use("/api", bookingRoutes);
app.use("/api/gate", gateRoutes);
app.use("/api", statsRoutes);

// Backward Compatibility Aliases
app.get("/parking/:area", async (req, res) => {
  req.query.lat = 12.9716;
  req.query.lng = 77.5946;
  req.query.area = req.params.area;
  const { getSpots } = require("./controllers/parkingController");
  return getSpots(req, res);
});

// Gate Terminal Quick Redirect
app.get("/gate", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "gate-simulator.html"));
});

// Root Health & API Overview
app.get("/", (req, res) => {
  res.json({
    status: "online",
    system: "ParkWise Enterprise Smart Parking Locator API",
    version: "2.1.0",
    database: getDatabaseStatus(),
    endpoints: {
      auth: ["POST /api/register", "POST /api/login", "GET /api/me"],
      parking: ["GET /api/parking?lat=&lng=&area=", "GET /api/search?q=", "GET /api/areas", "GET /api/parking/nearest?lat=&lng="],
      booking: ["POST /api/book", "POST /api/cancel", "GET /api/mybooking/:username", "POST /api/pricing/estimate"],
      gateVerification: ["POST /api/gate/verify-pass", "POST /api/gate/check-in", "POST /api/gate/check-out", "GET /api/gate/events"],
      stats: ["GET /api/stats", "GET /api/admin/bookings", "GET /api/admin/users"],
      gateSimulatorUI: "GET /gate (or http://localhost:5000/gate-simulator.html)"
    }
  });
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log("─────────────────────────────────────────────────────────────");
  console.log(`🚀 ParkWise Enterprise API running  →  http://localhost:${PORT}`);
  console.log(`📟 Gate Barrier Simulator tool   →  http://localhost:${PORT}/gate`);
  console.log(`📊 System Health & Stats endpoint  →  http://localhost:${PORT}/api/stats`);
  console.log("─────────────────────────────────────────────────────────────");
});

module.exports = app;