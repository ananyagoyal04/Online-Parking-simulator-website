const Spot = require("../models/Spot");
const Booking = require("../models/Booking");
const { generateGatePin, generateBookingId, buildQrPayload } = require("../utils/passGenerator");
const { calculatePrice } = require("../utils/pricingEngine");

function areaKey(lat, lng) {
  return `${parseFloat(lat).toFixed(3)}_${parseFloat(lng).toFixed(3)}`;
}

/**
 * @route POST /api/book
 * @desc Reserve a parking spot and issue Gate Entry Pass
 */
async function bookSpot(req, res) {
  const { lat, lng, spotId, username, area, durationHours, vehicleType, vehicleNumber } = req.body;

  if (!lat || !lng || !spotId || !username) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: lat, lng, spotId, and username are required."
    });
  }

  const pLat = parseFloat(lat);
  const pLng = parseFloat(lng);
  const key = areaKey(pLat, pLng);
  const parsedSpotId = parseInt(spotId);

  try {
    // 1. Check for existing active booking for user
    const existing = await Booking.findOne({ username: username.trim(), active: true });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `You already have an active booking (${existing.bookingId}). Please cancel or check-out before booking another slot.`
      });
    }

    // 2. Find and lock the spot
    const spot = await Spot.findOne({ areaKey: key, id: parsedSpotId });
    if (!spot) {
      return res.status(404).json({ success: false, error: "Parking spot not found." });
    }

    if (spot.status !== "empty") {
      return res.status(400).json({
        success: false,
        error: "This parking slot is no longer available. Please select another slot."
      });
    }

    // 3. Compute dynamic price
    const pricing = calculatePrice({
      baseRate: spot.rate || 30,
      durationHours: durationHours || 1,
      vehicleType: vehicleType || "sedan",
      spotType: spot.spotType || "standard",
      reservationTime: new Date()
    });

    // 4. Generate Pass Credentials
    const bookingId = generateBookingId(parsedSpotId, area || spot.areaName || "BGL");
    const gatePin = generateGatePin();
    const bookedAt = new Date();

    const bookingDraft = {
      bookingId,
      gatePin,
      username: username.trim(),
      spotId: spot.id,
      spotName: spot.name,
      areaKey: key,
      area: area || spot.areaName || "Bangalore",
      rate: spot.rate,
      durationHours: pricing.durationHours,
      vehicleType: pricing.vehicleType.type,
      vehicleNumber: vehicleNumber || "KA-01-EQ-9874",
      totalAmount: pricing.totalAmount,
      pricingBreakdown: pricing,
      lat: spot.lat,
      lng: spot.lng,
      bookedAt,
      status: "CONFIRMED",
      active: true
    };

    // 5. Generate signed QR Payload
    const qrPayload = buildQrPayload(bookingDraft);
    bookingDraft.qrPayload = qrPayload;

    // 6. Update spot status in database
    await Spot.findOneAndUpdate(
      { areaKey: key, id: parsedSpotId },
      {
        $set: {
          status: "reserved",
          bookedBy: username.trim(),
          bookingId: bookingId,
          bookedAt: bookedAt
        }
      }
    );

    // 7. Save Booking record
    await Booking.create(bookingDraft);

    // 8. Return response (both backward compatible + enriched)
    res.status(201).json({
      success: true,
      message: "Parking slot booked successfully",
      bookingId,
      gatePin,
      qrPayload,
      spotName: spot.name,
      spotId: spot.id,
      area: area || spot.areaName || "Bangalore",
      rate: spot.rate,
      effectiveHourlyRate: pricing.effectiveHourlyRate,
      totalAmount: pricing.totalAmount,
      durationHours: pricing.durationHours,
      pricingBreakdown: pricing,
      status: "CONFIRMED",
      bookedAt: bookedAt.toISOString()
    });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ success: false, error: "Database error during booking reservation." });
  }
}

/**
 * @route POST /api/cancel
 * @desc Cancel active booking & release spot
 */
async function cancelBooking(req, res) {
  const { bookingId, username } = req.body;

  if (!bookingId || !username) {
    return res.status(400).json({ success: false, error: "bookingId and username required" });
  }

  try {
    const booking = await Booking.findOne({
      bookingId: bookingId.trim(),
      username: username.trim(),
      active: true
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: "Active booking record not found." });
    }

    // Free the spot
    await Spot.findOneAndUpdate(
      { areaKey: booking.areaKey, id: booking.spotId },
      {
        $set: {
          status: "empty",
          bookedBy: null,
          bookingId: null,
          bookedAt: null
        }
      }
    );

    // Update booking status
    await Booking.findOneAndUpdate(
      { bookingId: booking.bookingId },
      {
        $set: {
          active: false,
          status: "CANCELLED"
        }
      }
    );

    res.json({
      success: true,
      message: "Booking cancelled successfully. Parking slot is now available."
    });
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ success: false, error: "Database error during cancellation." });
  }
}

/**
 * @route GET /api/mybooking/:username
 * @desc Get user's active booking pass
 */
async function getMyBooking(req, res) {
  const { username } = req.params;

  try {
    const booking = await Booking.findOne({ username: username.trim(), active: true });
    if (!booking) {
      return res.json({ success: true, booking: null });
    }

    const bookingData = booking.lean ? booking.lean() : booking;

    res.json({
      success: true,
      booking: {
        ...bookingData,
        gatePin: bookingData.gatePin || "—"
      }
    });
  } catch (err) {
    console.error("Get mybooking error:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
}

/**
 * @route POST /api/pricing/estimate
 * @desc Calculate dynamic pricing estimate
 */
function calculateEstimate(req, res) {
  const { baseRate, durationHours, vehicleType, spotType } = req.body;
  const pricing = calculatePrice({
    baseRate: baseRate || 40,
    durationHours: durationHours || 1,
    vehicleType: vehicleType || "sedan",
    spotType: spotType || "standard",
    reservationTime: new Date()
  });
  res.json({ success: true, pricing });
}

module.exports = {
  bookSpot,
  cancelBooking,
  getMyBooking,
  calculateEstimate
};
