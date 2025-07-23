const cron = require("node-cron");
const { getBalance } = require("../services/stockService");
const UserStock = require("../models/UserStock");
const User = require("../models/Auth"); // 사용자 모델 이름 확인
const RealInputData = require("../models/RealInputData");

// 1시간마다 실행
cron.schedule("0 * * * *", async () => {
  console.log("🕒 [주기적 업데이트] 시작됨");

  const users = await User.find(); // 모든 사용자 순회

  const cano = "50143725"; // ⚠️ 실제로는 user마다 다를 수 있음
  const acnt = "01";

  const result = await getBalance(cano, acnt);
  for (const user of users) {
    try {
      const stocks = (result.output1 || []).map((item) => ({
        stock_code: item.pdno,
      }));

      // 1. 업서트(있으면 유지/갱신, 없으면 추가)
      const updatePromises = stocks.map((stock) =>
        UserStock.findOneAndUpdate(
          { user_id: user._id, stock_code: stock.stock_code },
          { user_id: user._id, stock_code: stock.stock_code },
          { upsert: true, new: true }
        )
      );
      await Promise.all(updatePromises);

      // 2. 새로 받아온 주식목록에 없는 종목은 삭제
      const currentCodes = stocks.map((s) => s.stock_code);

      // 2-1. 삭제될 UserStock 목록(_id 뽑기)
      const deleteTargets = await UserStock.find({
        user_id: user._id,
        stock_code: { $nin: currentCodes },
      });
      const deleteIds = deleteTargets.map((doc) => doc._id);

      // 2-2. UserStock 삭제
      await UserStock.deleteMany({
        user_id: user._id,
        stock_code: { $nin: currentCodes },
      });

      // 2-3. RealInputData도 같이 삭제
      if (deleteIds.length > 0) {
        await RealInputData.deleteMany({ user_stock_id: { $in: deleteIds } });
      }

      console.log(
        `✅ ${user.email}: 보유주식 업서트 및 정리 완료 (${stocks.length}개)`
      );
    } catch (err) {
      console.error(`❌ ${user.email} 오류:`, err.message);
    }
  }
});
