const express = require("express");
const router = express.Router();
const { getBalance } = require("../services/stockService");
const { authenticate } = require("../middleware/auth");
const UserStock = require("../models/UserStock");
const Stocks = require("../models/Stocks");
// 보유 주식 저장
router.post("/", authenticate, async (req, res) => {
  const cano = "50143725";
  const acnt = "01";
  const userId = req.user._id;
  try {
    const result = await getBalance(cano, acnt);
    const stocks = (result.output1 || []).map((item) => ({
      stock_code: item.pdno,
    }));
    // 보유 종목이 하나도 없으면 모두 삭제
    if (stocks.length === 0) {
      await UserStock.deleteMany({ user_id: userId });
      return res.status(200).json({ success: true, message: "보유 종목 없음" });
    }
    // 1. 업서트(유지/추가)
    const updatePromises = stocks.map((stock) =>
      UserStock.findOneAndUpdate(
        { user_id: userId, stock_code: stock.stock_code },
        { upsert: true, new: true }
      )
    );
    await Promise.all(updatePromises);
    // 2. stocks에 없는 종목은 삭제
    const currentCodes = stocks.map((stock) => stock.stock_code);
    await UserStock.deleteMany({
      user_id: userId,
      stock_code: { $nin: currentCodes },
    });
    res.status(200).json({
      success: true,
      message: "계좌 연동 완료 (ID 유지)",
      inserted: stocks.length,
      output1: result.output1,
    });
  } catch (err) {
    console.error("계좌 연동 오류:", err.message);
    res.status(500).json({ error: "계좌 연동 실패" });
  }
});
// 보유 주식만 조회
router.get("/stock", authenticate, async (req, res) => {
  const userId = req.user._id;
  try {
    const userStock = await UserStock.find({ user_id: userId }).populate(
      "stock_code"
    );
    // stock_code만 추출
    const stockOnly = userStock.map((s) => s.stock_code);
    res.json({
      message: "보유 주식 코드만 추출 완료",
      stocks: stockOnly,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});
// 보유 주식 조회(전체)
router.get("/", async (req, res) => {
  try {
    const userStock = await UserStock.find()
      .populate("user_id", "nickname")
      .populate("stock_code");
    console.log("보유 주식 DB 조회 완료:", userStock);
    res.json({
      message: "보유 주식 DB 조회 완료",
      userStock,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});
// 보유 주식 여부
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





