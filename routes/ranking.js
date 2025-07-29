const express = require("express");
const router = express.Router();
const PracticeScore = require("../models/PracticeScore");
const PracticeChartData = require("../models/PracticeChartData");
const RealScore = require("../models/RealScore");
const UserStock = require("../models/UserStock");
const { authenticate } = require("../middleware/auth");
const RealInputData = require("../models/RealInputData");

//로그인 한 사용자가 푼 연습 문제 조회
router.get("/practice", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const scores = await PracticeScore.find({ user_id: userId })
      .populate([
        {
          path: "problem_id",
          select: "stock_code title date problemtype",
          populate: {
            path: "stock_code",
            select: "name logo",
            strictPopulate: false,
          },
          strictPopulate: false,
        },
      ])
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

// 문제별 랭킹 점수 조회
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

// 하루치 점수 계산
router.post("/day", async (req, res) => {
  try {
    // 1. 어제 날짜
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const yesterDay = `${year}-${month}-${day}`;
    console.log("yesterday", yesterDay);

    // 2. 어제 날짜의 모든 유저 예측값(RealInputData) 불러오기
    const predList = await RealInputData.find({ "prediction.date": yesterDay });
    let resultArr = [];

    for (const pred of predList) {
      // 3. user_stock_id로 stock_code 찾기 (UserStock 테이블에서)
      const userStock = await UserStock.findById(pred.user_stock_id);
      if (!userStock || !userStock.stock_code) continue;
      // console.log("userStock", userStock);

      const stock_code = userStock.stock_code;
      console.log("stock_code", stock_code);

      // 4. stock_code로 PracticeChartData에서 어제 가격 찾기
      const stockDoc = await PracticeChartData.findOne({ stock_code });
      if (!stockDoc || !Array.isArray(stockDoc.prices)) continue;

      const priceObj = stockDoc.prices.find((item) => item.date === yesterDay);
      const predObj = pred.prediction.find((item) => item.date === yesterDay);
      console.log("실제값 예측값", priceObj.close, predObj.close);
      if (
        !predObj ||
        !priceObj ||
        typeof priceObj.close !== "number" ||
        typeof predObj.close !== "number"
      )
        continue;

      // 5. 점수 계산
      const rawScore =
        100 - (Math.abs(predObj.close - priceObj.close) / priceObj.close) * 100;
      const dailyScore = Math.max(0, Math.round(rawScore));
      await RealScore.findOneAndUpdate(
        { user_stock_id: pred.user_stock_id, date: yesterDay },
        { $set: { score: Math.round(dailyScore) } },
        { upsert: true }
      );
      console.log("dailyScore", dailyScore);

      resultArr.push({
        user_stock_id: pred.user_stock_id,
        stock_code,
        date: yesterDay,
        pred: predObj.close,
        real: priceObj.close,
        score: Math.round(dailyScore),
      });
    }

    res.json({
      message: "모든 종목, 어제 날짜 하루치 점수 계산/저장 완료",
      resultArr,
    });
  } catch (err) {
    console.error("어제 하루치 점수 계산 에러:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

// 누적점수 계산
router.post("/cumulative", async (req, res) => {
  try {
    // 1. user_stock_id별 점수 모으기 (group by)
    const userScores = await RealScore.aggregate([
      {
        $group: {
          _id: "$user_stock_id",
          totalScore: { $sum: "$score" }, // 누적합
          avgScore: { $avg: "$score" }, // 평균
          count: { $sum: 1 },
        },
      },
    ]);

    const updatePromises = userScores.map(async (userScore) => {
      await UserStock.findByIdAndUpdate(userScore._id, {
        $set: {
          cumulative_score: Math.round(userScore.avgScore),
        },
      });
    });
    await Promise.all(updatePromises);

    res.json({
      message: "누적 점수 계산 및 업데이트 완료",
      updated: userScores.length,
      userScores,
    });
  } catch (err) {
    console.error("실전 랭킹 계산 에러:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

module.exports = router;
