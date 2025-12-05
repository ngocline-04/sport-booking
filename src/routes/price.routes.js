const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middlewares");

const { listPrices, createPrice } = require("../controllers/price.controller");

router.post("/create-price", verifyToken, createPrice);
router.get("/list-price", listPrices);

module.exports = router;
