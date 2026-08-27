const mongoose = require("mongoose");
const { isMongoConnected, InMemoryModel } = require("../config/db");

const spotSchema = new mongoose.Schema({
  areaKey:   { type: String, required: true },
  areaName:  { type: String, default: "Bangalore" },
  area:      { type: String, default: "Bangalore" },
  id:        { type: Number, required: true },
  lat:       { type: Number, required: true },
  lng:       { type: Number, required: true },
  name:      { type: String, required: true },
  status:    { type: String, enum: ["empty", "full", "reserved"], default: "empty" },
  rate:      { type: Number, default: 30 },
  spotType:  { type: String, enum: ["standard", "vip", "ev"], default: "standard" },
  bookedBy:  { type: String, default: null },
  bookingId: { type: String, default: null },
  bookedAt:  { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

spotSchema.index({ areaKey: 1, id: 1 }, { unique: true });

let SpotModel;
try {
  SpotModel = mongoose.model("Spot", spotSchema);
} catch (e) {
  SpotModel = mongoose.model("Spot");
}

const inMemorySpotModel = new InMemoryModel("spots");

const Spot = {
  async find(filter) {
    if (isMongoConnected()) return SpotModel.find(filter);
    return inMemorySpotModel.find(filter);
  },
  async findOne(filter) {
    if (isMongoConnected()) return SpotModel.findOne(filter);
    return inMemorySpotModel.findOne(filter);
  },
  async insertMany(docs) {
    if (isMongoConnected()) return SpotModel.insertMany(docs);
    return inMemorySpotModel.insertMany(docs);
  },
  async findOneAndUpdate(filter, update, options) {
    if (isMongoConnected()) return SpotModel.findOneAndUpdate(filter, update, options);
    return inMemorySpotModel.findOneAndUpdate(filter, update, options);
  },
  async countDocuments(filter) {
    if (isMongoConnected()) return SpotModel.countDocuments(filter);
    return inMemorySpotModel.countDocuments(filter);
  }
};

module.exports = Spot;
