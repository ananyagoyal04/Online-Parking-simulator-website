/**
 * ParkWise Dynamic Pricing Configuration Engine
 */

module.exports = {
  // Vehicle Category Multipliers
  VEHICLE_TYPES: {
    two_wheeler: {
      label: "Two Wheeler (Bike / Scooter)",
      multiplier: 0.5,
      icon: "🛵"
    },
    hatchback: {
      label: "Hatchback / Compact Car",
      multiplier: 0.85,
      icon: "🚗"
    },
    sedan: {
      label: "Sedan / Prime Car",
      multiplier: 1.0,
      icon: "🚘"
    },
    suv: {
      label: "SUV / Luxury / MUV",
      multiplier: 1.3,
      icon: "🚙"
    },
    ev: {
      label: "Electric Vehicle (Dedicated EV Bay)",
      multiplier: 1.4,
      evSurcharge: 15, // Fixed flat charging connection fee
      icon: "⚡"
    }
  },

  // Slot Types & Premiums
  SLOT_TYPES: {
    standard: { label: "Standard Bay", multiplier: 1.0 },
    vip: { label: "VIP Reserved Bay", multiplier: 1.35 },
    ev: { label: "EV Fast-Charge Bay", multiplier: 1.4 }
  },

  // Dynamic Surge Rules
  SURGE_RULES: {
    peakHours: {
      multiplier: 1.25,
      slots: [
        { start: 8.5, end: 11.5 }, // 8:30 AM to 11:30 AM
        { start: 17.0, end: 20.5 }  // 5:00 PM to 8:30 PM
      ]
    },
    highOccupancy: {
      threshold: 0.8, // If occupancy > 80%
      multiplier: 1.2
    },
    weekend: {
      multiplier: 1.15
    }
  },

  // Tax & Fee parameters
  TAX_RATE: 0.18, // 18% GST (CGST 9% + SGST 9%)
  MINIMUM_HOURS: 1,
  OVERSTAY_PENALTY_MULTIPLIER: 1.5 // 1.5x base hourly fee if exceeding booking
};
