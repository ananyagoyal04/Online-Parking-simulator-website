const mongoose = require("mongoose");
const { isMongoConnected, InMemoryModel } = require("../config/db");

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  gatePin: {
    type: String,
    required: true
  },
  qrPayload: {
    type: String,
    default: ""
  },
  username: {
    type: String,
    required: true
  },
  spotId: {
    type: Number,
    required: true
  },
  spotName: {
    type: String,
    required: true
  },
  areaKey: {
    type: String,
    required: true
  },
  area: {
    type: String,
    default: "Bangalore"
  },
  rate: {
    type: Number,
    required: true
  },
  durationHours: {
    type: Number,
    default: 1
  },
  vehicleType: {
    type: String,
    default: "sedan"
  },
  vehicleNumber: {
    type: String,
    default: "KA-01-EQ-9874"
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  pricingBreakdown: {
    type: Object,
    default: {}
  },
  lat: Number,
  lng: Number,
  bookedAt: {
    type: Date,
    default: Date.now
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ["CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"],
    default: "CONFIRMED"
  },
  active: {
    type: Boolean,
    default: true
  }
});

let BookingModel;
try {
  BookingModel = mongoose.model("Booking", bookingSchema);
} catch (e) {
  BookingModel = mongoose.model("Booking");
}

const inMemoryBookingModel = new InMemoryModel("bookings");

const Booking = {
  async find(filter) {
    if (isMongoConnected()) return BookingModel.find(filter);
    return inMemoryBookingModel.find(filter);
  },
  async findOne(filter) {
    if (isMongoConnected()) return BookingModel.findOne(filter);
    return inMemoryBookingModel.findOne(filter);
  },
  async create(data) {
    if (isMongoConnected()) return BookingModel.create(data);
    return inMemoryBookingModel.create(data);
  },
  async findOneAndUpdate(filter, update, options) {
    if (isMongoConnected()) return BookingModel.findOneAndUpdate(filter, update, options);
    return inMemoryBookingModel.findOneAndUpdate(filter, update, options);
  },
  async countDocuments(filter) {
    if (isMongoConnected()) return BookingModel.countDocuments(filter);
    return inMemoryBookingModel.countDocuments(filter);
  }
};

module.exports = Booking;
