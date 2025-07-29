const express = require("express");
const router = express.Router();
const { getBalance } = require("../services/stockService");
const { authenticate } = require("../middleware/auth");
const UserStock = require("../models/UserStock");
const RealScore = require("../models/RealScore");
// const UserStock = require("../models/UserStock");
const Auth = require("../models/Auth");

router.delete("/cleanup-orphans", async (req, res) => {
  try {
    // 1. 모든 유효한 user _id 조회
    const validUserIds = await RealScore.distinct("user_stock_id");

    // 2. UserStock에서 user_id가 없는 _id만 찾기
    const result = await UserStock.deleteMany({
      _id: { $nin: validUserIds },
    });

    return res.json({
      message: "고아 UserStock 삭제 완료",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("[고아 UserStock 삭제 오류]", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

// 보유 주식 저장
router.post("/", authenticate, async (req, res) => {
  const cano = "50143725";
  const acnt = "01";
  const userId = req.user._id;

  try {
    const result = await getBalance(cano, acnt);

    const stocks = (result.output1 || []).map((item) => ({
      stock_code: item.pdno,
      cumulative_score: 0,
      user_id: userId, // 항상 user_id 넣기!
    }));

    await UserStock.create(stocks);

    res.status(200).json({
      success: true,
      message: "계좌 연동 완료",
      inserted: stocks.length,
      output1: result.output1,
    });
  } catch (err) {
    if (err.code === 11000) {
      const existingStocks = await UserStock.find({ user_id: userId }).populate(
        "stock_code"
      );

      const formatted = existingStocks.map((s) => ({
        pdno: s.stock_code.code || s.stock_code._id.toString(), // ✅ 문자열로 보장
        prdt_name: s.stock_code.name || "",
      }));

      return res.status(200).json({
        success: true,
        message: "이미 연동된 주식이 있습니다.",
        output1: formatted,
      });
    }
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
    const stockOnly = userStock.map((s) => ({
      stock_code: s.stock_code, // populate된 종목 정보 전체
      cumulative_score: s.cumulative_score, // 보유 주식 문서의 필드
    }));
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

// 해당 유저가 보유한 주식인지 판단
router.get("/stock/:stock_code", authenticate, async (req, res) => {
  const userId = req.user._id;
  const { stock_code } = req.params;

  const hasStock = await UserStock.exists({
    user_id: userId,
    stock_code: stock_code,
  });
  if (!hasStock) {
    return res.status(403).json({ message: "보유하지 않은 주식입니다." });
  }

  res.json({ message: "ok", hasStock: !!hasStock });
});

module.exports = router;
