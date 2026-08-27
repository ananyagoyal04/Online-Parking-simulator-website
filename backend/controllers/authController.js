const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "parkwise_super_secure_jwt_secret_key_2026";

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || "driver"
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * @route POST /api/register
 * @desc Register new driver account
 */
async function register(req, res) {
  const { username, password, email, vehicleNumber, vehicleType } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Username and password are required."
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 6 characters long."
    });
  }

  try {
    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Username is already registered. Please sign in."
      });
    }

    const newUser = await User.create({
      username: username.trim(),
      password,
      email: (email || "").trim(),
      vehicleNumber: vehicleNumber || "KA-01-EQ-9874",
      vehicleType: vehicleType || "sedan"
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        vehicleNumber: newUser.vehicleNumber,
        vehicleType: newUser.vehicleType
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, error: "Server error during registration." });
  }
}

/**
 * @route POST /api/login
 * @desc Authenticate driver / attendant
 */
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Please enter both username and password."
    });
  }

  try {
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password."
      });
    }

    // Compare bcrypt hash or direct password fallback for seeded users
    let isMatch = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password."
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      username: user.username,
      email: user.email,
      vehicleNumber: user.vehicleNumber || "KA-01-EQ-9874",
      vehicleType: user.vehicleType || "sedan",
      role: user.role || "driver"
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Server error during login." });
  }
}

/**
 * @route GET /api/me
 * @desc Get current profile
 */
async function getProfile(req, res) {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        vehicleNumber: user.vehicleNumber,
        vehicleType: user.vehicleType,
        joinedAt: user.joinedAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
}

module.exports = {
  register,
  login,
  getProfile
};
