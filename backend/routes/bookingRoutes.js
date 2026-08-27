const express = require("express");
const router = express.Router();
const { bookSpot, cancelBooking, getMyBooking, calculateEstimate } = require("../controllers/bookingController");

router.post("/book", bookSpot);
router.post("/cancel", cancelBooking);
router.get("/mybooking/:username", getMyBooking);
router.post("/pricing/estimate", calculateEstimate);

module.exports = router;
