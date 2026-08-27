const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "parkwise_super_secure_jwt_secret_key_2026";

/**
 * Protect routes with JWT authentication
 */
function protect(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.headers["x-access-token"]) {
    token = req.headers["x-access-token"];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access denied. No authorization token provided."
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token."
    });
  }
}

/**
 * Optional authentication: extracts user if token provided, but doesn't block request
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {}
  }
  next();
}

module.exports = {
  protect,
  optionalAuth
};
