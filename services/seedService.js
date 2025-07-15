// services/seedService.js
const StockPrice = require("../models/Seed");

async function insertStockPrices(data) {
  try {
    const { stock_code, prices } = data;

    // stock_code가 이미 있으면 덮어쓰고, 없으면 새로 삽입
    await StockPrice.updateOne(
      { stock_code }, // 조건
      { $set: { prices } }, // 수정할 내용
      { upsert: true } // 없으면 insert
    );

    console.log(`${stock_code} 저장 또는 덮어쓰기 완료`);
  } catch (err) {
    console.error("저장 실패:", err.message);
  }
}

module.exports = { insertStockPrices };
