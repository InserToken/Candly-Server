// 매일 자정 전날 주가 데이터 업데이트
const cron = require("node-cron");
const { fetchDailyPrice } = require("../services/fetchStockPrice");
const Stock = require("../models/Stocks");
const dayjs = require("dayjs");

async function fetchAllStockPrice() {
  try {
    const today = dayjs().format("YYYY-MM-DD");
    const stocks = await Stock.find({}, "_id");

    for (const stock of stocks) {
      try {
        await fetchDailyPrice(stock._id, today);
      } catch (err) {
        console.error(`[실패] ${stock._id}: ${err.message}`);
      }
    }
    console.log(`[✅ 완료] ${stocks.length}개 종목 처리 완료`);
  } catch (err) {
    console.error(`[❌ 전체 작업 실패]: ${err.message}`);
  }
}

cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("[스케줄 시작] 매일 6시 직전 영업일 주가 데이터 수집");
    await fetchAllStockPrice();
  },
  { timezone: "Asia/Seoul" }
);
//테스트용
// cron.schedule("*/1 * * * *", async () => {
//   console.log("[스케줄 시작] 테스트 영업일 주가 데이터 수집");
//   await fetchAllStockPrice();
// });

module.exports = { fetchAllStockPrice };
