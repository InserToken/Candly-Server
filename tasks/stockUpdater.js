const cron = require("node-cron");
const { getBalance } = require("../services/stockService");
const UserStock = require("../models/UserStock");
const User = require("../models/Auth"); // 사용자 모델 이름 확인

// 1분마다 실행
cron.schedule("* * * * *", async () => {
  console.log("🕒 [주기적 업데이트] 시작됨");

  const users = await User.find(); // 모든 사용자 순회

  const cano = "50143725"; // ⚠️ 실제로는 user마다 다를 수 있음
  const acnt = "01";

  const result = await getBalance(cano, acnt);
  for (const user of users) {
    try {
      const stocks = (result.output1 || []).map((item) => ({
        stock_code: item.pdno,
        cumulative_score: 0,
        user_id: user._id,
      }));

      await UserStock.deleteMany({ user_id: user._id });

      if (stocks.length > 0) {
        await UserStock.insertMany(stocks);
        console.log(`✅ ${user.email} - ${stocks.length}개 저장`);
      } else {
        console.log(`📭 ${user.email} - 보유 종목 없음`);
      }
    } catch (err) {
      console.error(`❌ ${user.email} 오류:`, err.message);
    }
  }
});
