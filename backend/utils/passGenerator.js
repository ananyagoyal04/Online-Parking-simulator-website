/**
 * Security & Verification Pass Generator
 * Generates verified 6-digit gate PINs, unique booking reference IDs,
 * and signed QR code tokens for automated barrier terminals and attendants.
 */

const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "parkwise_super_secure_jwt_secret_key_2026";

/**
 * Generate a clean, memorable 6-digit Gate PIN (e.g. 748291)
 */
function generateGatePin() {
  const pin = Math.floor(100000 + Math.random() * 900000);
  return String(pin);
}

/**
 * Generate a professional Booking Reference (e.g. PK-BGL-8392-A1)
 */
function generateBookingId(slotId, areaName = "BGL") {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  const areaCode = areaName.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "BGL";
  return `PK-${areaCode}-${timestamp}${random}`;
}

/**
 * Generate a cryptographic tamper-evident pass signature for the QR Code
 */
function generatePassSignature(bookingData) {
  const payload = `${bookingData.bookingId}:${bookingData.username}:${bookingData.spotId}:${bookingData.gatePin}`;
  const hmac = crypto.createHmac("sha256", JWT_SECRET);
  hmac.update(payload);
  return hmac.digest("hex").slice(0, 16);
}

/**
 * Build the full QR Code string for gate scanners
 */
function buildQrPayload(booking) {
  const signature = generatePassSignature(booking);
  return JSON.stringify({
    app: "ParkWise",
    v: "2.1",
    id: booking.bookingId,
    user: booking.username,
    spot: booking.spotName,
    pin: booking.gatePin,
    rate: booking.rate,
    total: booking.totalAmount || booking.rate,
    bookedAt: booking.bookedAt,
    sig: signature
  });
}

/**
 * Verify if a QR pass signature is authentic and untampered
 */
function verifyPassSignature(booking) {
  const expected = generatePassSignature(booking);
  return booking.sig === expected || booking.signature === expected;
}

module.exports = {
  generateGatePin,
  generateBookingId,
  generatePassSignature,
  buildQrPayload,
  verifyPassSignature
};
