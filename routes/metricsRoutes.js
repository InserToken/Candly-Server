const express = require("express");
const router = express.Router();
const { computeMetrics } = require("../services/metricsService");

router.get("/metrics", async (req, res) => {
  const { stockCode, date } = req.query;
  if (!stockCode || !date) {
    return res.status(400).json({ error: "stockCode, date 필요" });
  }
  try {
    const metrics = await computeMetrics(stockCode, date);
    res.json(metrics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
