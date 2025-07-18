const express = require("express");
const router = express.Router();
// const stock = require("../models/Stocks");
const PracticeChartData = require("../models/PracticeChartData");

//뉴스조회
router.get("/:stock_code/news", async (req, res) => {
  try {
    const { stock_code } = req.params;

    if (!stock_code) {
      return res
        .status(400)
        .json({ error: "stock code 파라미터가 필요합니다." });
    }

    const chartData = await PracticeChartData.findOne({ stock_code });

    if (!chartData || !chartData.prices || chartData.prices.length === 0) {
      return res.status(404).json({ error: "차트 데이터가 없습니다." });
    }

    const sortedPrices = chartData.prices.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return res.json({
      newsdata,
    });
  } catch (err) {
    console.error("뉴스 조회 에러:", err);
    res.status(500).json({ error: "뉴스 조회 중 오류 발생" });
  }
});

module.exports = router;
