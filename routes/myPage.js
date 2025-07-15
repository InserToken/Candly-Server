const express = require("express");
const router = express.Router();
// const { getBalance } = require("../services/stockService");
const { authenticate } = require("../middleware/auth");
const UserStock = require("../models/UserStock");

router.get("/", async (req, res) => {
  const data = req.cookies;

  res.json(boards);
});

module.exports = router;
