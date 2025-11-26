const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middlewares");

const { createLocation, listLocations, updateLocation, deleteLocation } = require("../controllers/location.controller");

router.post("/create-location", verifyToken, createLocation);
router.get("/list-location", listLocations);
router.put("/update_location/:id", verifyToken, updateLocation);
router.delete("/delete_location/:id", verifyToken, deleteLocation);


module.exports = router;
