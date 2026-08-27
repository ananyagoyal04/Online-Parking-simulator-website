const express = require("express");
const router = express.Router();
const { getStats, getAdminBookings, getAdminUsers } = require("../controllers/statsController");

router.get("/stats", getStats);
router.get("/admin/bookings", getAdminBookings);
router.get("/admin/users", getAdminUsers);

module.exports = router;
