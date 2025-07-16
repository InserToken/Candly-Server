const express = require("express");
const router = express.Router();
const Holiday = require("../models/Holiday");

router.get("/", async (req, res) => {
  const holidays = await Holiday.find({});
  res.json(holidays);
});

module.exports = router;
