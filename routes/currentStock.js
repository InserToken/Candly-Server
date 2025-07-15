// routes/stockPrice.js
const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * GET /api/stock-price?code=005930
 * 종목 코드로 현재 주가를 네이버 금융에서 크롤링해 반환
 */
router.get("/stock-price", async (req, res) => {
  const stockCode = req.query.code;

  if (!stockCode) {
    return res.status(400).json({ error: "종목 코드가 누락되었습니다." });
  }

  try {
    const url = `https://finance.naver.com/item/main.nhn?code=${stockCode}`;
    const response = await fetch(url);
    const html = await response.text();

    const $ = cheerio.load(html);
    const priceText = $("#chart_area .rate_info .no_today .blind")
      .first()
      .text()
      .replace(/,/g, "");

    const price = parseInt(priceText, 10);

    if (isNaN(price)) {
      return res.status(500).json({ error: "주가 파싱 실패" });
    }

    res.status(200).json({ code: stockCode, price });
  } catch (err) {
    console.error("크롤링 에러:", err.message);
    res.status(500).json({ error: "주가 크롤링 중 서버 오류" });
  }
});

module.exports = router;
