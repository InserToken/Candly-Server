const PracticeNews = require("../models/StockNews");

async function insertPracticeNews(dataArray) {
  try {
    for (const item of dataArray) {
      const { problem_id, stockName, date, news } = item;

      await PracticeNews.updateOne(
        { problem_id }, // 문제 ID 기준으로 중복 방지
        { $set: { stockName, date, news } },
        { upsert: true }
      );
    }

    console.log("PracticeNews 데이터 저장 또는 갱신 완료");
  } catch (err) {
    console.error("PracticeNews 저장 실패:", err.message);
  }
}

module.exports = { insertPracticeNews };
