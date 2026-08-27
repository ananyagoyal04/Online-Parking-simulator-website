const Spot = require("../models/Spot");
const BANGALORE_AREAS = require("../config/bangaloreAreas");
const { calculateDistanceKm, findNearest } = require("../utils/geo");

function areaKey(lat, lng) {
  return `${parseFloat(lat).toFixed(3)}_${parseFloat(lng).toFixed(3)}`;
}

const SLOT_NAMES = [
  "Slot A1", "Slot A2", "Slot B1", "Slot B2",
  "Slot C1", "Slot C2", "Slot D1", "Slot D2",
  "VIP Bay", "EV Fast Charge"
];

const BLOCK_NAMES = [
  "Ground Plaza", "North Annex", "South Wing", "East Gate Bay",
  "West Gate Tower", "Basement Level 1", "Rooftop SkyDeck", "Tech Hub Annex",
  "Executive Floor", "Mall Plaza Bay"
];

const RATES = [20, 30, 40, 50, 60, 80];

function generateRealisticSpots(lat, lng, areaName, key) {
  const spots = [];
  for (let i = 0; i < 10; i++) {
    const angle  = (i / 10) * 2 * Math.PI + (i % 3) * 0.15;
    const radius = 0.0008 + (i % 4) * 0.0006;
    const isEv = i === 9;
    const isVip = i === 8;
    const initialStatuses = ["empty", "empty", "empty", "full", "reserved", "empty", "empty"];
    const status = initialStatuses[i % initialStatuses.length];

    spots.push({
      areaKey: key,
      areaName: areaName || "Bangalore",
      area: areaName || "Bangalore",
      id: i + 1,
      lat: parseFloat((lat + radius * Math.cos(angle)).toFixed(6)),
      lng: parseFloat((lng + radius * Math.sin(angle)).toFixed(6)),
      name: `${SLOT_NAMES[i]} · ${BLOCK_NAMES[i]}`,
      status,
      rate: isVip ? 70 : (isEv ? 60 : RATES[i % RATES.length]),
      spotType: isEv ? "ev" : (isVip ? "vip" : "standard"),
      bookedBy: null,
      bookingId: null,
      bookedAt: null,
      createdAt: new Date()
    });
  }
  return spots;
}

/**
 * @route GET /api/parking
 * @desc Get spots near coordinates
 */
async function getSpots(req, res) {
  const { lat, lng, area } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: "Latitude and Longitude are required." });
  }

  const pLat = parseFloat(lat);
  const pLng = parseFloat(lng);
  const key = areaKey(pLat, pLng);

  try {
    let spots = await Spot.find({ areaKey: key });
    let spotsList = spots && spots.lean ? spots.lean() : (Array.isArray(spots) ? spots : []);

    if (!spotsList || spotsList.length === 0) {
      const generated = generateRealisticSpots(pLat, pLng, area || "Bangalore", key);
      await Spot.insertMany(generated);
      const freshlyInserted = await Spot.find({ areaKey: key });
      spotsList = freshlyInserted && freshlyInserted.lean ? freshlyInserted.lean() : freshlyInserted;
    }

    // Attach computed distance
    const enriched = (spotsList || []).map(s => ({
      ...s,
      distanceKm: calculateDistanceKm(pLat, pLng, s.lat, s.lng)
    }));

    res.json(enriched);
  } catch (err) {
    console.error("Error fetching spots:", err);
    res.status(500).json({ success: false, error: "Database error while fetching spots." });
  }
}

/**
 * @route GET /api/search
 * @desc Search Bangalore parking locations
 */
function searchAreas(req, res) {
  const q = (req.query.q || "").toLowerCase().trim();
  if (!q) {
    return res.json(BANGALORE_AREAS);
  }
  const filtered = BANGALORE_AREAS.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.area.toLowerCase().includes(q) ||
    (a.zone && a.zone.toLowerCase().includes(q))
  );
  res.json(filtered);
}

/**
 * @route GET /api/areas
 * @desc Get all Bangalore parking hubs
 */
function getAreas(req, res) {
  res.json(BANGALORE_AREAS);
}

/**
 * @route GET /api/parking/nearest
 * @desc Get nearest available empty spot
 */
async function getNearestSpot(req, res) {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: "lat and lng required" });
  }
  const uLat = parseFloat(lat);
  const uLng = parseFloat(lng);
  const key = areaKey(uLat, uLng);

  try {
    const spots = await Spot.find({ areaKey: key });
    const spotsList = spots && spots.lean ? spots.lean() : spots;
    const available = (spotsList || []).filter(s => s.status === "empty");

    if (!available.length) {
      return res.status(404).json({ success: false, message: "No available spots found nearby" });
    }

    let nearest = available[0];
    let minDistance = calculateDistanceKm(uLat, uLng, nearest.lat, nearest.lng);

    for (let s of available) {
      const d = calculateDistanceKm(uLat, uLng, s.lat, s.lng);
      if (d < minDistance) {
        minDistance = d;
        nearest = s;
      }
    }

    res.json({
      success: true,
      spot: nearest,
      distanceKm: minDistance,
      formattedDistance: minDistance < 1 ? `${Math.round(minDistance * 1000)} m` : `${minDistance.toFixed(1)} km`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Error calculating nearest spot" });
  }
}

module.exports = {
  getSpots,
  searchAreas,
  getAreas,
  getNearestSpot
};
