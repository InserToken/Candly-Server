const express = require("express");
const router = express.Router();
const stock = require("../models/Stocks");
const fetchRealNews = require("../services/fetchRealNews");
const RealInputData = require("../models/RealInputData");
const { authenticate } = require("../middleware/auth");
const userStock = require("../models/UserStock");

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

//실전 예측 입력
router.post("/:stock_code", authenticate, async (req, res) => {
  try {
    const { stock_code } = req.params;
    const userId = req.user._id;

    if (!stock_code) {
      return res
        .status(400)
        .json({ error: "stock code 파라미터가 필요합니다." });
    }

    const { predictions } = req.body;

    const user_stock_id = await userStock
      .findOne({ user_id: userId, stock_code: stock_code })
      .select("_id");

    if (!user_stock_id) {
      return res.status(404).json({ error: "해당 종목을 찾을 수 없습니다." });
    }

    const existing = await RealInputData.findOne({ user_stock_id });
    if (existing) {
      await RealInputData.updateOne(
        { user_stock_id },
        { $set: { prediction: predictions } }
      );
      return res.status(200).json({ message: "예측이 업데이트되었습니다." });
    } else {
      const realInvest = await RealInputData.create({
        user_stock_id: user_stock_id,
        prediction: predictions,
      });
      return res.status(201).json(realInvest);
    }
  } catch (err) {
    console.error("예측 입력 에러:", err);
    res.status(500).json({ error: "예측 입력 중 오류 발생" });
  }
});

router.get("/:stock_code", authenticate, async (req, res) => {
  try {
    const { stock_code } = req.params;
    const userId = req.user._id;

    if (!stock_code) {
      return res
        .status(400)
        .json({ error: "stock code 파라미터가 필요합니다." });
    }

    const user_stock_id = await userStock
      .findOne({ user_id: userId, stock_code: stock_code })
      .select("_id");

    if (!user_stock_id) {
      return res.status(404).json({ error: "해당 종목을 찾을 수 없습니다." });
    }

    const realData = await RealInputData.findOne({ user_stock_id });

    if (!realData) {
      return res.status(200).json({ prediction: [] });
    }

    return res.status(200).json({ prediction: realData.prediction });
  } catch (err) {
    console.error("예측 조회 에러:", err);
    res.status(500).json({ error: "예측 조회 중 오류 발생" });
  }
});

module.exports = router;
