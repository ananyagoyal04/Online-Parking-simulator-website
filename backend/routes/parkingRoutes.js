const express = require("express");
const router = express.Router();
const { getSpots, searchAreas, getAreas, getNearestSpot } = require("../controllers/parkingController");

router.get("/parking", getSpots);
router.get("/search", searchAreas);
router.get("/areas", getAreas);
router.get("/parking/nearest", getNearestSpot);

module.exports = router;
