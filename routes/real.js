const express = require("express");
const router = express.Router();
const stock = require("../models/Stocks");
const fetchRealNews = require("../services/fetchRealNews");

// 뉴스조회
router.get("/:stock_code/news", async (req, res) => {
  try {
    const { stock_code } = req.params;

    if (!stock_code) {
      return res
        .status(400)
        .json({ error: "stock code 파라미터가 필요합니다." });
    }

    const stockInfo = await stock.findOne({ _id: stock_code });
    const stockName = stockInfo.name;

    const newsdata = await fetchRealNews(stockName);

    if (!newsdata) {
      return res.status(404).json({ error: "최근 뉴스가 없습니다." });
    }

    return res.json({
      newsdata,
    });
  } catch (err) {
    console.error("뉴스 조회 에러:", err);
    res.status(500).json({ error: "뉴스 조회 중 오류 발생" });
  }
});

module.exports = router;
