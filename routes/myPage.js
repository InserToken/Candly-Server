const express = require("express");
const router = express.Router();
const UserStock = require("../models/UserStock");
const RealScore = require("../models/RealScore");
const PracticeScore = require("../models/PracticeScore");
const PracticeProblem = require("../models/PracticeProblem");
const { authenticate } = require("../middleware/auth");

//연습 문제 조회
router.get("/practice", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const scores = await PracticeScore.find({ user_id: userId })
      .populate({
        path: "problem_id",
        select: "stock_code title date", // 필요한 필드만 선택
        strictPopulate: false,
      })
      .sort({ date: -1 }); // 최신순 정렬

    res.json({
      message: "연습 투자 예측 점수 조회 성공",
      data: scores,
    });
  } catch (err) {
    console.error("PracticeScore 조회 에러:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

//실전 문제 조회
router.get("/real/scores", authenticate, async (req, res) => {
  const userId = req.user._id;

  try {
    // 1. 사용자의 보유 주식 전체 조회
    const userStocks = await UserStock.find({ user_id: userId });

    // 2. 각 주식에 대해 RealScore 조회
    const result = await Promise.all(
      userStocks.map(async (stock) => {
        const scores = await RealScore.find({ user_stock_id: stock._id });

        return {
          stock_code: stock.stock_code,
          stock_id: stock._id,
          scores: scores.map((score) => ({
            score: score.score,
            date: score.date,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("실전투자 점수 조회 에러:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

// //실전 문제 전체 조회
// router.get("/realscore", authenticate, async (req, res) => {
//   const userId = req.user._id;

//   try {
//     // 1. 해당 사용자의 UserStock ID 목록 조회
//     const userStocks = await UserStock.find({ user_id: userId }).select("_id");

//     const userStockIds = userStocks.map((stock) => stock._id);

//     // 2. RealScore에서 그 중 하나라도 있나 확인
//     const hasScore = await RealScore.exists({
//       user_stock_id: { $in: userStockIds },
//     });

//     res.status(200).json({
//       hasHoldings: !!hasScore,
//     });
//   } catch (err) {
//     console.error("보유 주식 확인 에러:", err);
//     res.status(500).json({ message: "서버 에러" });
//   }
// });

module.exports = router;
