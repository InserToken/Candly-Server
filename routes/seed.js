// routes/seedRouter.js
// 차트 정보 넣기

const express = require("express");
const { insertStockPrices } = require("../services/seedService");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/load", async (req, res) => {
  try {
    const dirPath = path.join(__dirname, "../kospi200_chart");
    const files = fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith(".json"));

    for (const fileName of files) {
      const filePath = path.join(dirPath, fileName);
      const rawData = fs.readFileSync(filePath, "utf-8");
      const jsonData = JSON.parse(rawData);
      await insertStockPrices(jsonData);
    }

    res.status(200).json({ message: "모든 JSON 파일 DB에 저장 완료" });
  } catch (err) {
    console.error("파일 처리 중 오류:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
