const express = require("express");
const router = express.Router();
const Holiday = require("../models/Holiday");

router.get("/", async (req, res) => {
  const holidays = await Holiday.find({});
  let holidaySet = new Set();
  holidaySet = new Set(holidays.map((h) => h.date));
  res.json([...holidaySet]);
});

module.exports = router;
