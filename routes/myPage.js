const express = require("express");
const router = express.Router();
const UserStock = require("../models/UserStock");
const RealScore = require("../models/RealScore");

const { authenticate } = require("../middleware/auth");

//연습 문제 조회
router.get("/practice", authenticate, async (req, res) => {
  try {
    const userId = req.user._id; // 로그인된 사용자 기준 (authenticate 미들웨어 필요)

    const scores = await PracticeScore.find({ user_id: userId }).populate({
      path: "problem_id",
      select: "stock_code title date", // 필요한 필드만 선택
    });

    res.status(200).json({
      message: "연습 투자 예측 점수 조회 성공",
      data: scores,
    });
  } catch (err) {
    console.error("PracticeScore 조회 에러:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

//실전 문제 조회
router.get("/real", authenticate, async (req, res) => {
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

//실전 문제 전체 조회
router.get("/realscore", authenticate, async (req, res) => {
  const userId = req.user._id;

  try {
    // 1. 해당 사용자의 UserStock ID 목록 조회
    const userStocks = await UserStock.find({ user_id: userId }).select("_id");

    const userStockIds = userStocks.map((stock) => stock._id);

    // 2. RealScore에서 그 중 하나라도 있나 확인
    const hasScore = await RealScore.exists({
      user_stock_id: { $in: userStockIds },
    });

    res.status(200).json({
      hasHoldings: !!hasScore,
    });
  } catch (err) {
    console.error("보유 주식 확인 에러:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

module.exports = router;
