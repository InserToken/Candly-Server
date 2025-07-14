const express = require("express");
const router = express.Router();
const { getBalance } = require("../services/stockService");

router.get("/", async (req, res) => {
  const cano = "50143725";
  const acnt = "01";

  try {
    const data = await getBalance(cano, acnt);
    res.json(data);
  } catch (err) {
    console.error("잔고 조회 오류:", err.message);
    res.status(500).json({ error: "잔고 조회 실패" });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { getBalance } = require("../services/getBalance");
// const Stock = require("../models/Stock");
// const UserStock = require("../models/UserStock");

// router.post("/", async (req, res) => {
//   try {
//     const { userId, cano, acntPrdtCd } = req.body;
//     const data = await getBalance(cano, acntPrdtCd);
//     const stocks = data.output1;

//     for (const item of stocks) {
//       const { pdno, prdt_name } = item;

//       // 주식 저장 (중복 처리)
//       await Stock.updateOne(
//         { stock_code: pdno },
//         { $set: { company: prdt_name, state: true } },
//         { upsert: true }
//       );

//       // 보유 주식 저장
//       await UserStock.updateOne(
//         { user_id: userId, stock_code: pdno },
//         { $setOnInsert: { cumulative_score: 0 } },
//         { upsert: true }
//       );
//     }

//     res.json({ count: stocks.length, stocks: stocks.map((s) => s.prdt_name) });
//   } catch (err) {
//     console.error("잔고 조회 오류:", err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;
