const express = require("express");
const fs = require("fs");
const path = require("path");
const { insertPracticeNews } = require("../services/stockNewsSeedService");

const router = express.Router();

router.get("/load-practice-news", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../all_news_grouped_1.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(rawData);

    await insertPracticeNews(jsonData);

    res.status(200).json({ message: "PracticeNews 데이터 저장 완료" });
  } catch (err) {
    console.error("PracticeNews JSON 파일 처리 오류:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
