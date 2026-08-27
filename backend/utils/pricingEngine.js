/**
 * ParkWise Dynamic Pricing Calculation Engine
 * Accurately computes pricing based on base hourly rate, vehicle category,
 * duration in hours, time-of-day peak surge, and GST tax breakdown.
 */

const pricingConfig = require("../config/pricingConfig");

/**
 * Calculate dynamic price breakdown for a parking slot reservation
 */
function calculatePrice({
  baseRate = 30,
  durationHours = 1,
  vehicleType = "sedan",
  spotType = "standard",
  reservationTime = new Date()
}) {
  const hours = Math.max(1, parseFloat(durationHours) || 1);
  const vType = pricingConfig.VEHICLE_TYPES[vehicleType] || pricingConfig.VEHICLE_TYPES.sedan;
  const sType = pricingConfig.SLOT_TYPES[spotType] || pricingConfig.SLOT_TYPES.standard;

  // 1. Vehicle & Spot Multiplier
  const vehicleMultiplier = vType.multiplier;
  const spotMultiplier = sType.multiplier;
  const evSurcharge = (vehicleType === "ev" && vType.evSurcharge) ? vType.evSurcharge : 0;

  // 2. Time-based Surge Detection
  const dateObj = new Date(reservationTime);
  const currentHour = dateObj.getHours() + dateObj.getMinutes() / 60;
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

  let surgeMultiplier = 1.0;
  let surgeReason = "Standard Pricing (Off-Peak)";

  // Check peak hours
  const isPeakHour = pricingConfig.SURGE_RULES.peakHours.slots.some(
    slot => currentHour >= slot.start && currentHour <= slot.end
  );

  if (isPeakHour) {
    surgeMultiplier = pricingConfig.SURGE_RULES.peakHours.multiplier;
    surgeReason = "Peak Traffic Hours Surge (1.25x)";
  } else if (isWeekend) {
    surgeMultiplier = pricingConfig.SURGE_RULES.weekend.multiplier;
    surgeReason = "Weekend Leisure Demand (1.15x)";
  }

  // 3. Hourly dynamic rate
  const effectiveHourlyRate = Math.round(baseRate * vehicleMultiplier * spotMultiplier * surgeMultiplier);
  const subtotal = Math.round(effectiveHourlyRate * hours + evSurcharge);

  // 4. Taxes & GST (18%)
  const gstAmount = Math.round(subtotal * pricingConfig.TAX_RATE);
  const totalAmount = subtotal + gstAmount;

  return {
    baseRate,
    durationHours: hours,
    vehicleType: {
      type: vehicleType,
      label: vType.label,
      multiplier: vehicleMultiplier,
      icon: vType.icon
    },
    spotType: {
      type: spotType,
      label: sType.label,
      multiplier: spotMultiplier
    },
    surge: {
      multiplier: surgeMultiplier,
      applied: surgeMultiplier > 1.0,
      reason: surgeReason
    },
    effectiveHourlyRate,
    evChargingFee: evSurcharge,
    subtotal,
    taxBreakdown: {
      gstRatePercent: 18,
      cgstAmount: Math.round(gstAmount / 2),
      sgstAmount: Math.round(gstAmount / 2),
      totalGst: gstAmount
    },
    totalAmount,
    currency: "INR (₹)"
  };
}

module.exports = {
  calculatePrice
};
