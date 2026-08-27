const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { isMongoConnected, InMemoryModel } = require("../config/db");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    default: "",
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ["driver", "attendant", "admin"],
    default: "driver"
  },
  vehicleNumber: {
    type: String,
    default: "KA-01-EQ-9874"
  },
  vehicleType: {
    type: String,
    enum: ["two_wheeler", "hatchback", "sedan", "suv", "ev"],
    default: "sedan"
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save bcrypt password hash for Mongoose
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password verification helper method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

let UserModel;
try {
  UserModel = mongoose.model("User", userSchema);
} catch (e) {
  UserModel = mongoose.model("User");
}

const inMemoryUserModel = new InMemoryModel("users");

// Unified model proxy
const User = {
  async find(filter) {
    if (isMongoConnected()) return UserModel.find(filter);
    return inMemoryUserModel.find(filter);
  },
  async findOne(filter) {
    if (isMongoConnected()) return UserModel.findOne(filter);
    return inMemoryUserModel.findOne(filter);
  },
  async create(data) {
    if (isMongoConnected()) {
      return UserModel.create(data);
    }
    // Hash password for in-memory mode as well
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    return inMemoryUserModel.create({
      ...data,
      password: hashedPassword,
      joinedAt: new Date()
    });
  },
  async countDocuments(filter) {
    if (isMongoConnected()) return UserModel.countDocuments(filter);
    return inMemoryUserModel.countDocuments(filter);
  }
};

module.exports = User;