const express = require("express");
const { insertStocks } = require("../services/stockSeedService");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/load-stocks", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../kospi200_codes.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(rawData); // 배열 형태

    await insertStocks(jsonData);

    res.status(200).json({ message: "종목 목록 저장 완료" });
  } catch (err) {
    console.error("종목 목록 저장 실패:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
