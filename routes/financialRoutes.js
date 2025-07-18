const express = require("express");
const router = express.Router();
const FinancialSummary = require("../models/FinancialSummary");
const { getFinancialSummary } = require("../services/fetchFinancialData");
const getCorpCodeByStockCode = require("../utils/getCorpCode");

router.get("/fetch", async (req, res) => {
  const { stockCode, start, end } = req.query;
  if (!stockCode || !start || !end)
    return res.status(400).json({ error: "stockCode, start, end 필요" });

  try {
    // 1) 분기별 원본 + TTM/지표까지 계산된 entries 배열 반환
    const entries = await getFinancialSummary(
      stockCode,
      Number(start),
      Number(end)
    );
    if (!entries.length) return res.status(404).json({ error: "데이터 없음" });

    // 2) corp_code 채우기
    const corp_code = getCorpCodeByStockCode(stockCode);

    // 3) DB에 저장 (upsert)
    await FinancialSummary.updateOne(
      { stock_code: stockCode },
      { $set: { stock_code: stockCode, corp_code, entries } },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "✅ 저장 완료", count: entries.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
