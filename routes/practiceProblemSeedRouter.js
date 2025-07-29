// 연습문제 넣기

const express = require("express");
const {
  insertPracticeProblems,
} = require("../services/practiceProblemSeedService");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/load-practice-problems", async (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../practice_problem_2018up_simple.json"
    );
    const rawData = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(rawData); // 배열 형태

    await insertPracticeProblems(jsonData);

    res.status(200).json({ message: "연습문제 데이터 저장 완료" });
  } catch (err) {
    console.error("PracticeProblem JSON 파일 처리 오류:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
