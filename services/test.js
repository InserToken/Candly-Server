// //practicechartdata db에서 중복된 날짜 제거
const mongoose = require("mongoose");
const PracticeChartData = require("../models/PracticeChartData"); // 경로 수정
require("dotenv").config();

async function removeDuplicatePrices() {
  await mongoose.connect(process.env.DB_URI);

  const docs = await PracticeChartData.find({});

  for (const doc of docs) {
    const seen = new Map(); // 날짜 -> 첫 price
    const uniquePrices = [];

    for (const price of doc.prices) {
      if (!seen.has(price.date)) {
        seen.set(price.date, true);
        uniquePrices.push(price);
      }
    }

    if (uniquePrices.length !== doc.prices.length) {
      console.log(
        `[중복 제거] ${doc.stock_code}: ${doc.prices.length} → ${uniquePrices.length}`
      );
      doc.prices = uniquePrices;
      await doc.save();
    }
  }

  await mongoose.disconnect();
  console.log("✅ 중복 제거 완료");
}

removeDuplicatePrices().catch((err) => {
  console.error("❌ 오류 발생:", err);
});

// // 테스트용, 전 종목 직전일 주가정보 업데이트
// const mongoose = require("mongoose");
// // const { fetchDailyPrice } = require("./fetchStockPrice");

// const { fetchAllStockPrice } = require("../tasks/dailyStockUpdater");
// async function testInsert() {
//   try {
//     await mongoose.connect(process.env.DB_URI);
//     await fetchAllStockPrice();
//   } catch (err) {
//     console.error("❌ 오류 발생:", err);
//   } finally {
//     await mongoose.disconnect();
//   }
// }

// testInsert();
