const Booking = require("../models/Booking");
const Spot = require("../models/Spot");
const { verifyPassSignature } = require("../utils/passGenerator");
const pricingConfig = require("../config/pricingConfig");

let recentGateEvents = [];

function logGateEvent(type, booking, details = {}) {
  const event = {
    id: `EVT-${Date.now()}`,
    type, // "ENTRY_VERIFIED", "CHECK_IN", "CHECK_OUT", "DENIED"
    timestamp: new Date(),
    bookingId: booking ? booking.bookingId : null,
    gatePin: booking ? booking.gatePin : null,
    spotName: booking ? booking.spotName : null,
    username: booking ? booking.username : null,
    vehicleNumber: booking ? booking.vehicleNumber : null,
    ...details
  };
  recentGateEvents.unshift(event);
  if (recentGateEvents.length > 50) recentGateEvents.pop();
  return event;
}

/**
 * @route POST /api/gate/verify-pass
 * @desc Verify QR Pass Payload or 6-digit Gate PIN at the parking spot terminal
 */
async function verifyGatePass(req, res) {
  const { code, gatePin, bookingId, qrPayload } = req.body;

  const searchCode = (code || gatePin || bookingId || "").trim();

  try {
    let booking = null;

    if (qrPayload) {
      try {
        const parsed = typeof qrPayload === "string" ? JSON.parse(qrPayload) : qrPayload;
        if (parsed.id) {
          booking = await Booking.findOne({ bookingId: parsed.id });
        }
      } catch (e) {}
    }

    if (!booking && searchCode) {
      // Check by Gate PIN or Booking ID
      booking = await Booking.findOne({
        $or: [
          { gatePin: searchCode },
          { bookingId: searchCode }
        ]
      });
    }

    if (!booking) {
      logGateEvent("DENIED", null, { reason: "Invalid Pass Code / PIN not recognized", enteredCode: searchCode });
      return res.status(404).json({
        success: false,
        accessGranted: false,
        gateAction: "ACCESS_DENIED",
        error: "Invalid Pass Code. No matching reservation found."
      });
    }

    const bookingData = booking.lean ? booking.lean() : booking;

    if (!bookingData.active && bookingData.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        accessGranted: false,
        gateAction: "ACCESS_DENIED",
        error: "This parking pass has already been used and completed."
      });
    }

    if (!bookingData.active && bookingData.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        accessGranted: false,
        gateAction: "ACCESS_DENIED",
        error: "This reservation was cancelled."
      });
    }

    // Determine gate action
    const isCheckedIn = bookingData.status === "CHECKED_IN";
    const recommendedAction = isCheckedIn ? "OPEN_EXIT_BARRIER" : "OPEN_ENTRY_BARRIER";

    logGateEvent("ENTRY_VERIFIED", bookingData, { gateAction: recommendedAction });

    res.json({
      success: true,
      accessGranted: true,
      gateAction: recommendedAction,
      message: isCheckedIn ? "Pass verified for exit checkout." : "Pass verified! Barrier opening.",
      pass: {
        bookingId: bookingData.bookingId,
        gatePin: bookingData.gatePin,
        username: bookingData.username,
        spotName: bookingData.spotName,
        spotId: bookingData.spotId,
        area: bookingData.area,
        rate: bookingData.rate,
        totalPaid: bookingData.totalAmount || bookingData.rate,
        durationHours: bookingData.durationHours || 1,
        vehicleNumber: bookingData.vehicleNumber || "KA-01-EQ-9874",
        vehicleType: bookingData.vehicleType || "sedan",
        status: bookingData.status,
        bookedAt: bookingData.bookedAt,
        checkInTime: bookingData.checkInTime
      }
    });
  } catch (err) {
    console.error("Gate verification error:", err);
    res.status(500).json({ success: false, error: "Gate terminal validation error" });
  }
}

/**
 * @route POST /api/gate/check-in
 * @desc Record vehicle entry at the spot barrier
 */
async function checkIn(req, res) {
  const { gatePin, bookingId } = req.body;
  const searchCode = (gatePin || bookingId || "").trim();

  try {
    const booking = await Booking.findOne({
      $or: [{ gatePin: searchCode }, { bookingId: searchCode }],
      active: true
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: "Active reservation not found" });
    }

    const checkInTime = new Date();

    // Update booking state
    await Booking.findOneAndUpdate(
      { bookingId: booking.bookingId },
      {
        $set: {
          status: "CHECKED_IN",
          checkInTime
        }
      }
    );

    // Update Spot state to full / occupied
    await Spot.findOneAndUpdate(
      { areaKey: booking.areaKey, id: booking.spotId },
      { $set: { status: "full" } }
    );

    logGateEvent("CHECK_IN", booking, { checkInTime });

    res.json({
      success: true,
      barrierOpened: true,
      message: `Entry approved for vehicle ${booking.vehicleNumber || "KA-01-EQ-9874"}. Barrier raised.`,
      spotName: booking.spotName,
      checkInTime: checkInTime.toISOString()
    });
  } catch (err) {
    console.error("Gate check-in error:", err);
    res.status(500).json({ success: false, error: "Check-in failed" });
  }
}

/**
 * @route POST /api/gate/check-out
 * @desc Record vehicle exit, calculate overstay fee (if any), and free the spot
 */
async function checkOut(req, res) {
  const { gatePin, bookingId } = req.body;
  const searchCode = (gatePin || bookingId || "").trim();

  try {
    const booking = await Booking.findOne({
      $or: [{ gatePin: searchCode }, { bookingId: searchCode }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    const checkOutTime = new Date();
    const startTime = booking.checkInTime ? new Date(booking.checkInTime) : new Date(booking.bookedAt);
    const durationMinutes = Math.max(1, Math.round((checkOutTime - startTime) / 60000));
    const durationHours = (durationMinutes / 60).toFixed(2);

    // Overstay calculation
    const reservedHours = booking.durationHours || 1;
    let overstayFee = 0;
    if (parseFloat(durationHours) > reservedHours) {
      const extraHours = Math.ceil(parseFloat(durationHours) - reservedHours);
      overstayFee = Math.round(extraHours * booking.rate * pricingConfig.OVERSTAY_PENALTY_MULTIPLIER);
    }

    // Release Spot
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

    // Complete Booking
    await Booking.findOneAndUpdate(
      { bookingId: booking.bookingId },
      {
        $set: {
          status: "COMPLETED",
          active: false,
          checkOutTime
        }
      }
    );

    logGateEvent("CHECK_OUT", booking, { checkOutTime, durationMinutes, overstayFee });

    res.json({
      success: true,
      barrierOpened: true,
      message: `Checkout complete for slot ${booking.spotName}. Barrier raised. Thank you!`,
      invoice: {
        bookingId: booking.bookingId,
        spotName: booking.spotName,
        parkedDuration: `${durationMinutes} mins (${durationHours} hrs)`,
        basePaid: booking.totalAmount || booking.rate,
        overstayFee,
        totalSettlement: (booking.totalAmount || booking.rate) + overstayFee,
        checkInTime: startTime.toISOString(),
        checkOutTime: checkOutTime.toISOString()
      }
    });
  } catch (err) {
    console.error("Gate checkout error:", err);
    res.status(500).json({ success: false, error: "Checkout error" });
  }
}

/**
 * @route GET /api/gate/events
 * @desc Get real-time gate terminal activity logs
 */
function getGateEvents(req, res) {
  res.json({
    success: true,
    count: recentGateEvents.length,
    events: recentGateEvents
  });
}

module.exports = {
  verifyGatePass,
  checkIn,
  checkOut,
  getGateEvents
};
