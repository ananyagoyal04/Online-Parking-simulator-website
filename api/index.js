/**
 * Vercel Serverless Function Handler
 * Wraps the ParkWise Express application for Vercel serverless execution.
 */

const app = require("../backend/server");

module.exports = app;
