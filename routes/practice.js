const express = require("express");
const router = express.Router();
const PracticeProblem = require("../models/PracticeProblem");

router.get("/", async (req, res) => {
  try {
    const practiceProblem = await PracticeProblem.find();

    console.log("연습 문제 전체 조회 완료");
    res.json({
      message: "연습 문제 전체 조회 완료",
      practiceProblem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
