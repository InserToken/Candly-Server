const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const PracticeProblem = require("../models/PracticeProblem");
const PracticeChartData = require("../models/PracticeChartData");
const practiceNews = require("../models/PracticeNews");

//문제정보조회
router.get("/:problemId", async (req, res) => {
  try {
    const { problemId } = req.params;

    if (!problemId) {
      return res.status(400).json({ error: "문제 Id 파라미터가 필요합니다." });
    }

    const objectId = new mongoose.Types.ObjectId(problemId);
    const problemInfo = await PracticeProblem.findOne({ _id: objectId });

    if (!problemInfo) {
      return res.status(404).json({ error: "해당 문제를 찾을 수 없습니다." });
    }

    const { date, stock_code, title, problemtype } = problemInfo;
    const targetDateStr = date.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // 해당 종목 차트 데이터 조회
    const chartData = await PracticeChartData.findOne({ stock_code });

    if (!chartData || !chartData.prices || chartData.prices.length === 0) {
      return res.status(404).json({ error: "차트 데이터가 없습니다." });
    }

    // 날짜 정렬
    const sortedPrices = chartData.prices.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // 문제 날짜 인덱스 찾기
    const targetIndex = sortedPrices.findIndex(
      (price) => price.date === targetDateStr
    );

    if (targetIndex === -1) {
      return res.status(404).json({ error: "해당 날짜 데이터가 없습니다." });
    }

    // 140일 전부터 20일 후까지 자르기
    const start = Math.max(0, targetIndex - 139);
    const end = Math.min(sortedPrices.length, targetIndex + 21);
    const tenDaySlice = sortedPrices.slice(start, end);

    return res.json({
      date: targetDateStr,
      stock_code,
      title,
      problemtype,
      prices: tenDaySlice,
    });
  } catch (err) {
    console.error("문제 조회 에러:", err);
    res.status(500).json({ error: "문제 조회 중 오류 발생" });
  }
});

//뉴스조회
router.get("/:problemId/news", async (req, res) => {
  try {
    const { problemId } = req.params;

    if (!problemId) {
      return res.status(400).json({ error: "문제 Id 파라미터가 필요합니다." });
    }

    const newsdata = await practiceNews.findOne({ problem_id: problemId });

    if (!newsdata) {
      return res
        .status(404)
        .json({ error: "해당 문제에 해당하는 뉴스를 찾을 수 없습니다." });
    }

    const news = newsdata.news;

    return res.json({
      news,
    });
  } catch (err) {
    console.error("뉴스 조회 에러:", err);
    res.status(500).json({ error: "뉴스 조회 중 오류 발생" });
  }
});

module.exports = router;
