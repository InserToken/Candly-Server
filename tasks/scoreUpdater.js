const cron = require("node-cron");
// 실제 서버 주소로 변경!
const BASE_URL = "http://localhost:3001/api/rank";

cron.schedule("10 8 * * *", async () => {
  try {
    // 1. 하루치 점수 계산
    console.log("[CRON] Start day calculation");
    const dayRes = await fetch(`${BASE_URL}/day`, { method: "POST" });
    const dayJson = await dayRes.json();
    console.log("[CRON] day result:", dayJson);

    // 2. 누적점수 계산
    console.log("[CRON] Start cumulative calculation");
    const cumRes = await fetch(`${BASE_URL}/cumulative`, { method: "POST" });
    const cumJson = await cumRes.json();
    console.log("[CRON] cumulative result:", cumJson);
  } catch (err) {
    console.error("[CRON] 에러:", err.message);
  }
});
