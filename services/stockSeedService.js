const Stock = require("../models/Stock");

async function insertStocks(stockList) {
  try {
    for (const stock of stockList) {
      const { _id, name } = stock;

      await Stock.updateOne({ _id }, { $set: { name } }, { upsert: true });
    }

    console.log("Stocks 저장 또는 덮어쓰기 완료");
  } catch (err) {
    console.error("Stocks 저장 실패:", err.message);
  }
}

module.exports = { insertStocks };
