const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────
//  MONGODB CONNECTION
// ─────────────────────────────────────────────────────────────
mongoose.connect("mongodb://127.0.0.1:27017/parkwise")
  .then(() => console.log("✅ MongoDB connected → parkwise database"))
  .catch(err => { console.error("❌ MongoDB error:", err.message); process.exit(1); });

// ─────────────────────────────────────────────────────────────
//  SCHEMAS & MODELS
// ─────────────────────────────────────────────────────────────

// Users
const userSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true },
  password:  { type: String, required: true },
  email:     { type: String, default: "" },
  joinedAt:  { type: Date,   default: Date.now },
});
const User = mongoose.model("User", userSchema);

// Parking spots (cached per area key)
const spotSchema = new mongoose.Schema({
  areaKey:   { type: String, required: true },   // "lat_lng" rounded key
  areaName:  { type: String, default: "Bangalore" },
  id:        { type: Number, required: true },   // spot number within area (1–10)
  lat:       Number,
  lng:       Number,
  name:      String,
  status:    { type: String, enum: ["empty","full","reserved"], default: "empty" },
  rate:      Number,
  bookedBy:  { type: String, default: null },
  bookingId: { type: String, default: null },
  bookedAt:  { type: Date,   default: null },
});
// Compound unique: one spot id per area
spotSchema.index({ areaKey: 1, id: 1 }, { unique: true });
const Spot = mongoose.model("Spot", spotSchema);

// Bookings
const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  username:  { type: String, required: true },
  spotId:    Number,
  spotName:  String,
  areaKey:   String,
  area:      String,
  rate:      Number,
  lat:       Number,
  lng:       Number,
  bookedAt:  { type: Date, default: Date.now },
  active:    { type: Boolean, default: true },
});
const Booking = mongoose.model("Booking", bookingSchema);

// ─────────────────────────────────────────────────────────────
//  SPOT GENERATION HELPERS
// ─────────────────────────────────────────────────────────────
const SLOT_NAMES = [
  "Slot A1","Slot A2","Slot B1","Slot B2",
  "Slot C1","Slot C2","Slot D1","Slot D2",
  "VIP Bay","Visitor Bay",
];
const BLOCK_NAMES = [
  "Main Block","North Wing","South Wing","East Gate",
  "West Gate","Basement L1","Rooftop Deck","Commercial Hub",
  "Tech Park Bay","Mall Annex",
];
const RATES = [20, 30, 40, 50, 60, 80];

function buildSpots(lat, lng, areaName, areaKey) {
  const spots = [];
  for (let i = 0; i < 10; i++) {
    const angle  = (i / 10) * 2 * Math.PI + Math.random() * 0.4;
    const radius = 0.0008 + Math.random() * 0.0025;
    const staticStatuses = ["empty","empty","empty","full","reserved"];
    spots.push({
      areaKey,
      areaName,
      id:     i + 1,
      lat:    parseFloat((lat + radius * Math.cos(angle)).toFixed(6)),
      lng:    parseFloat((lng + radius * Math.sin(angle)).toFixed(6)),
      name:   `${SLOT_NAMES[i]} · ${BLOCK_NAMES[i]}`,
      status: staticStatuses[Math.floor(Math.random() * staticStatuses.length)],
      rate:   RATES[Math.floor(Math.random() * RATES.length)],
      bookedBy:  null,
      bookingId: null,
      bookedAt:  null,
    });
  }
  return spots;
}

function areaKey(lat, lng) {
  return `${parseFloat(lat).toFixed(3)}_${parseFloat(lng).toFixed(3)}`;
}

// Get spots from DB; create them if first visit to this area
async function getOrCreateSpots(lat, lng, areaName) {
  const key   = areaKey(lat, lng);
  let   spots = await Spot.find({ areaKey: key }).lean();
  if (!spots.length) {
    const fresh = buildSpots(parseFloat(lat), parseFloat(lng), areaName || "Bangalore", key);
    await Spot.insertMany(fresh);
    spots = await Spot.find({ areaKey: key }).lean();
  }
  return spots;
}

// ─────────────────────────────────────────────────────────────
//  BANGALORE AREAS  (for search)
// ─────────────────────────────────────────────────────────────
const BANGALORE_AREAS = [
  { name:"Koramangala",      lat:12.9279, lng:77.6271 },
  { name:"Indiranagar",      lat:12.9784, lng:77.6408 },
  { name:"Whitefield",       lat:12.9698, lng:77.7500 },
  { name:"Jayanagar",        lat:12.9250, lng:77.5938 },
  { name:"Malleshwaram",     lat:13.0035, lng:77.5680 },
  { name:"Yelahanka",        lat:13.1005, lng:77.5963 },
  { name:"Electronic City",  lat:12.8399, lng:77.6770 },
  { name:"HSR Layout",       lat:12.9116, lng:77.6474 },
  { name:"Banashankari",     lat:12.9255, lng:77.5468 },
  { name:"JP Nagar",         lat:12.9063, lng:77.5857 },
  { name:"Rajajinagar",      lat:12.9916, lng:77.5520 },
  { name:"Basavanagudi",     lat:12.9425, lng:77.5742 },
  { name:"Hebbal",           lat:13.0353, lng:77.5972 },
  { name:"Marathahalli",     lat:12.9591, lng:77.6974 },
  { name:"BTM Layout",       lat:12.9166, lng:77.6101 },
  { name:"MG Road",          lat:12.9758, lng:77.6097 },
  { name:"Brigade Road",     lat:12.9716, lng:77.6099 },
  { name:"UB City",          lat:12.9719, lng:77.5960 },
  { name:"Sarjapur Road",    lat:12.9121, lng:77.6855 },
  { name:"Bellandur",        lat:12.9259, lng:77.6762 },
  { name:"Bannerghatta",     lat:12.8648, lng:77.5993 },
  { name:"Kengeri",          lat:12.9088, lng:77.4820 },
  { name:"Yeshwanthpur",     lat:13.0275, lng:77.5432 },
  { name:"Vijayanagar",      lat:12.9714, lng:77.5333 },
  { name:"RT Nagar",         lat:13.0218, lng:77.5941 },
  { name:"Nagarbhavi",       lat:12.9562, lng:77.5057 },
  { name:"KR Puram",         lat:13.0050, lng:77.6953 },
  { name:"Old Airport Road", lat:12.9631, lng:77.6473 },
  { name:"Church Street",    lat:12.9753, lng:77.6072 },
  { name:"Cunningham Road",  lat:12.9942, lng:77.5983 },
];

// ─────────────────────────────────────────────────────────────
//  ID GENERATOR
// ─────────────────────────────────────────────────────────────
function makeBookingId() {
  return "PK-" + Date.now().toString(36).toUpperCase()
       + "-" + Math.random().toString(36).substring(2,5).toUpperCase();
}

// ─────────────────────────────────────────────────────────────
//  ROUTES — AUTH
// ─────────────────────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  try {
    await User.create({ username, password, email: email || "" });
    res.json({ message: "Account created successfully" });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: "Username already taken" });
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password }).lean();
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ message: "Login successful", username, email: user.email });
});

// ─────────────────────────────────────────────────────────────
//  ROUTES — PARKING
// ─────────────────────────────────────────────────────────────
app.get("/api/parking", async (req, res) => {
  const { lat, lng, area } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "lat & lng required" });
  try {
    const spots = await getOrCreateSpots(parseFloat(lat), parseFloat(lng), area);
    res.json(spots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

app.get("/api/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  if (!q) return res.json(BANGALORE_AREAS);
  res.json(BANGALORE_AREAS.filter(a => a.name.toLowerCase().includes(q)));
});

app.get("/api/areas", (req, res) => res.json(BANGALORE_AREAS));

// ─────────────────────────────────────────────────────────────
//  ROUTES — BOOKING
// ─────────────────────────────────────────────────────────────
app.post("/api/book", async (req, res) => {
  const { lat, lng, spotId, username, area } = req.body;
  const key = areaKey(parseFloat(lat), parseFloat(lng));

  try {
    // Check user doesn't already have an active booking
    const existing = await Booking.findOne({ username, active: true }).lean();
    if (existing)
      return res.status(400).json({ error: `You already have booking ${existing.bookingId}` });

    // Find and lock the spot
    const spot = await Spot.findOne({ areaKey: key, id: parseInt(spotId) });
    if (!spot)
      return res.status(404).json({ error: "Spot not found" });
    if (spot.status !== "empty")
      return res.status(400).json({ error: "Spot is no longer available" });

    const bookingId = makeBookingId();
    const bookedAt  = new Date();

    // Update spot in DB
    spot.status    = "reserved";
    spot.bookedBy  = username;
    spot.bookingId = bookingId;
    spot.bookedAt  = bookedAt;
    await spot.save();

    // Create booking record in DB
    await Booking.create({
      bookingId, username,
      spotId:   spot.id,
      spotName: spot.name,
      areaKey:  key,
      area:     area || spot.areaName,
      rate:     spot.rate,
      lat:      spot.lat,
      lng:      spot.lng,
      bookedAt,
    });

    res.json({
      message: "Booked successfully",
      bookingId,
      spotName: spot.name,
      area:     area || spot.areaName,
      rate:     spot.rate,
      bookedAt: bookedAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error during booking" });
  }
});

app.post("/api/cancel", async (req, res) => {
  const { bookingId, username } = req.body;
  try {
    const booking = await Booking.findOne({ bookingId, username, active: true });
    if (!booking)
      return res.status(404).json({ error: "Booking not found" });

    // Free the spot
    await Spot.findOneAndUpdate(
      { areaKey: booking.areaKey, id: booking.spotId },
      { status: "empty", bookedBy: null, bookingId: null, bookedAt: null }
    );

    // Mark booking inactive (keep history)
    booking.active = false;
    await booking.save();

    res.json({ message: "Booking cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error during cancel" });
  }
});

app.get("/api/mybooking/:username", async (req, res) => {
  try {
    const booking = await Booking.findOne({ username: req.params.username, active: true }).lean();
    if (!booking) return res.json({ booking: null });
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

// ─────────────────────────────────────────────────────────────
//  ROUTES — STATS  (good for presentation)
// ─────────────────────────────────────────────────────────────
app.get("/api/stats", async (req, res) => {
  try {
    const [totalUsers, totalBookings, activeBookings, totalSpots, availableSpots] =
      await Promise.all([
        User.countDocuments(),
        Booking.countDocuments(),
        Booking.countDocuments({ active: true }),
        Spot.countDocuments(),
        Spot.countDocuments({ status: "empty" }),
      ]);
    res.json({ totalUsers, totalBookings, activeBookings, totalSpots, availableSpots });
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

// All bookings history — useful for admin/presentation
app.get("/api/admin/bookings", async (req, res) => {
  const all = await Booking.find().sort({ bookedAt: -1 }).lean();
  res.json(all);
});

// All users — useful for presentation demo
app.get("/api/admin/users", async (req, res) => {
  const all = await User.find({}, "-password").sort({ joinedAt: -1 }).lean();
  res.json(all);
});

// ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("✅ ParkWise API + MongoDB Running"));
app.listen(5000, () => {
  console.log("🚀 ParkWise backend  →  http://localhost:5000");
  console.log("🗄️  MongoDB database  →  mongodb://127.0.0.1:27017/parkwise");
});