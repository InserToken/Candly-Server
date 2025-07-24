const express = require("express");
const router = express.Router();
const stock = require("../models/Stocks");
const fetchRealNews = require("../services/fetchRealNews");
const RealInputData = require("../models/RealInputData");
const { authenticate } = require("../middleware/auth");
const userStock = require("../models/UserStock");
const practiceChartData = require("../models/PracticeChartData");
const { getCurrentPrice } = require("../services/fetchCurrentPrice");

let newsCache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1시간
// 뉴스조회
router.get("/:stock_code/news", async (req, res) => {
  try {
    const { stock_code } = req.params;
    if (!stock_code) {
      return res
        .status(400)
        .json({ error: "stock code 파라미터가 필요합니다." });
    }

    // 1. 캐시 먼저 확인
    const now = Date.now();
    if (
      newsCache[stock_code] &&
      now - newsCache[stock_code].timestamp < CACHE_TTL
    ) {
      return res.json({ newsdata: newsCache[stock_code].data });
    }

    // 2. DB에서 종목명 조회
    const stockInfo = await stock.findOne({ _id: stock_code });
    const stockName = stockInfo.name;

    // 3. 실제 뉴스 fetch
    const newsdata = await fetchRealNews(stockName);

    if (!newsdata) {
      return res.status(404).json({ error: "최근 뉴스가 없습니다." });
    }

    // 4. 캐시에 저장
    newsCache[stock_code] = {
      data: newsdata,
      timestamp: now,
    };

    return res.json({ newsdata });
  } catch (err) {
    console.error("뉴스 조회 에러:", err);
    res.status(500).json({ error: "뉴스 조회 중 오류 발생" });
  }
});

// 예측입력
router.post("/:stock_code", authenticate, async (req, res) => {
  try {
    const { stock_code } = req.params;
    const userId = req.user._id;
    const { predictions } = req.body;

    if (!stock_code || !Array.isArray(predictions)) {
      return res.status(400).json({ error: "잘못된 요청입니다." });
    }

    // 1. user_id + stock_code로 userStock 문서 찾기
    let userStockDoc = await userStock.findOne({ user_id: userId, stock_code });

    // 1-1. 없으면 오류 반환
    if (!userStockDoc) {
      return res
        .status(404)
        .json({ error: "해당 주식을 보유하지 않은 사용자입니다." });
    }

    // 2. RealInputData에서 user_stock_id로 데이터 검색 후 update 또는 create
    const updated = await RealInputData.findOneAndUpdate(
      { user_stock_id: userStockDoc._id },
      { prediction: predictions },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res
      .status(200)
      .json({ message: "예측 데이터가 저장되었습니다.", data: updated });
  } catch (err) {
    console.error("예측 데이터 저장 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 예측조회
router.get("/:stock_code", authenticate, async (req, res) => {
  try {
    const { stock_code } = req.params;
    const userId = req.user._id;

    if (!stock_code) {
      return res.status(400).json({ error: "stock_code가 필요합니다." });
    }

    // 1. userId + stock_code로 UserStock 문서 조회
    const userStockDoc = await userStock.findOne({
      user_id: userId,
      stock_code,
    });

    if (!userStockDoc) {
      return res
        .status(404)
        .json({ error: "해당 주식을 보유하지 않은 사용자입니다." });
    }

    // 2. 해당 user_stock_id로 RealInputData 조회
    const realInput = await RealInputData.findOne({
      user_stock_id: userStockDoc._id,
    });
    if (!realInput) {
      // 예측 데이터가 없을 경우
      return res.status(200).json({ prediction: [] });
    }

    res.status(200).json({ prediction: realInput.prediction });
  } catch (err) {
    console.error("예측 데이터 조회 오류:", err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

//차트조회
router.get("/:stock_code/chart", async (req, res) => {
  try {
    const { stock_code } = req.params;

    if (!stock_code) {
      return res
        .status(400)
        .json({ error: "stock code 파라미터가 필요합니다." });
    }
    const chartData = await practiceChartData.findOne({ stock_code });
    const prices = chartData.prices;

    return res.json({ prices });
  } catch (err) {
    console.error("실전차트 조회 에러:", err);
    res.status(500).json({ error: "실전차트 조회 중 오류 발생" });
  }
});

//실시간시세조회
router.get("/:stock_code/currentprice", async (req, res) => {
  try {
    const { stock_code } = req.params;

    if (!stock_code) {
      return res
        .status(400)
        .json({ error: "stock code 파라미터가 필요합니다." });
    }
    const currentprice = await getCurrentPrice(stock_code);

    return res.status(200).json({ currentprice: currentprice });
  } catch (err) {
    console.error("실시간 시세 조회 에러:", err);
    res.status(500).json({ error: "실시간 시세 조회 중 오류 발생" });
  }
});

module.exports = router;
