const express = require("express");
const router = express.Router();
const { getBalance } = require("../services/stockService");
const { authenticate } = require("../middleware/auth");
const UserStock = require("../models/UserStock");

router.post("/", authenticate, async (req, res) => {
  const cano = "50143725";
  const acnt = "01";
  const userId = req.user._id;

  try {
    const result = await getBalance(cano, acnt);

    const stocks = (result.output1 || []).map((item) => ({
      stock_code: item.pdno,
      cumulative_score: 0,
    }));

    if (stocks.length === 0) {
      return res.status(200).json({ success: true, message: "보유 종목 없음" });
    }
    console.log("보유 주식 조회 userId", userId);

    // 중복 없이 저장
    const bulkOps = stocks.map((stock) => ({
      updateOne: {
        filter: { user_id: userId, stock_code: stock.stock_code },
        update: { $setOnInsert: { ...stock, user_id: userId } },
        upsert: true,
      },
    }));

    await UserStock.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: "계좌 연동 완료",
      inserted: stocks.length,
      output1: result.output1,
    });
  } catch (err) {
    console.error("계좌 연동 오류:", err.message);
    res.status(500).json({ error: "계좌 연동 실패" });
  }
});

router.get("/", async (req, res) => {
  try {
    const userStock = await UserStock.find();

    console.log("보유 주식 DB 조회 완료:", userStock);
    res.json({ message: "보유 주식 DB 조회 완료", userStock });
  } catch (err) {
    console.error(err);
    res.status(500);
    next(err);
  }
});

router.get("/status", authenticate, async (req, res) => {
  const userId = req.user._id;
  try {
    const hasStock = await UserStock.exists({ user_id: userId });

    res.status(200).json({
      hasHoldings: !!hasStock, // boolean 값으로 변경
    });
  } catch (err) {
    console.error("보유 주식 확인 에러:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

module.exports = router;
