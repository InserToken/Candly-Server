const PracticeProblem = require("../models/PracticeProblem");

async function insertPracticeProblems(dataArray) {
  try {
    for (const item of dataArray) {
      const { stock_code, problemtype, title, date } = item;

      await PracticeProblem.updateOne(
        { stock_code, problemtype, date }, // 중복 방지 조건
        { $set: { title } },
        { upsert: true }
      );
    }

    console.log(`PracticeProblem 데이터 저장 또는 덮어쓰기 완료`);
  } catch (err) {
    console.error("PracticeProblem 저장 실패:", err.message);
  }
}

module.exports = { insertPracticeProblems };
