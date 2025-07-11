const express = require("express");
const router = express.Router();
const { getBalance } = require("../services/stockService");

router.get("/", async (req, res) => {
  const cano = "50143725";
  const acnt = "01";

  try {
    const data = await getBalance(cano, acnt);
    res.json(data);
  } catch (err) {
    console.error("잔고 조회 오류:", err.message);
    res.status(500).json({ error: "잔고 조회 실패" });
  }
});

module.exports = router;
