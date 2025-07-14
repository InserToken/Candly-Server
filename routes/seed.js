const express = require("express");
const { insertStockPrices } = require("../services/seedService");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// GET /api/seed/load : 서버에 있는 json 파일(practice_chartdata.json)을 읽어서 DB에 저장
router.get("/load", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../practice_chartdata.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(rawData);

    await insertStockPrices(jsonData);

    res.status(200).json({ message: "서버에서 파일 불러와 저장 완료" });
  } catch (err) {
    console.error("JSON 파일 불러오기 실패:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
