const express = require("express");
const router = express.Router();
const PracticeScore = require("../models/PracticeScore");
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
      message: "내가 푼 연습 예측 점수 조회 성공",
      data: scores,
    });
  } catch (err) {
    console.error("PracticeScore 조회 에러:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

router.get("/problem", async (req, res) => {
  try {
    const scores = await PracticeScore.find()
      .populate("user_id", "nickname")
      .sort({ score: -1 }); // 점수 높은 순 정렬

    res.json({
      message: "문제 별 연습 예측 랭킹 점수 조회 성공",
      data: scores,
    });
  } catch (err) {
    console.error("PracticeScore 조회 에러:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

module.exports = router;
