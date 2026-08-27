const express = require("express");
const router = express.Router();
const { verifyGatePass, checkIn, checkOut, getGateEvents } = require("../controllers/gateController");

router.post("/verify-pass", verifyGatePass);
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/events", getGateEvents);

module.exports = router;
