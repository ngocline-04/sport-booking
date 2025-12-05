const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middlewares");
const {
  createBooking,
  listMyBookings,
} = require("../controllers/booking.controller");

router.post("/create", verifyToken, createBooking);
router.get("/list-booking", verifyToken, listMyBookings);

module.exports = router;
