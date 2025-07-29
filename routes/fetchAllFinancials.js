// routes/fetchAllFinancials.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const FinancialSummary = require("../models/FinancialSummary");
const { getFinancialSummary } = require("../services/fetchFinancialData");
const getCorpCodeByStockCode = require("../utils/getCorpCode");

/**
 * GET /api/fetch-all?start=2020&end=2024
 * kospi200_codes.json에 있는 모든 종목에 대해 재무요약을 가져와 저장합니다.
 */
router.get("/fetch-all", async (req, res) => {
  const startYear = parseInt(req.query.start, 10) || 2020;
  const endYear = parseInt(req.query.end, 10) || new Date().getFullYear();

  try {
    // 1) JSON 파일 읽기
    const codesPath = path.resolve(__dirname, "../kospi200_codes.json");
    const raw = await fs.readFile(codesPath, "utf8");
    const kospi200 = JSON.parse(raw); // [ { _id: "005930", name: "삼성전자" }, … ]

    const results = [];

    // 2) 순회하며 fetch & upsert
    for (const { _id: stockCode, name } of kospi200) {
      try {
        const entries = await getFinancialSummary(
          stockCode,
          startYear,
          endYear
        );
        if (!entries || entries.length === 0) {
          results.push({ stockCode, name, status: "no data" });
          continue;
        }

        const corp_code = getCorpCodeByStockCode(stockCode);
        await FinancialSummary.updateOne(
          { stock_code: stockCode },
          { $set: { stock_code: stockCode, corp_code, entries } },
          { upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        results.push({
          stockCode,
          name,
          status: "saved",
          count: entries.length,
        });
      } catch (err) {
        results.push({
          stockCode,
          name,
          status: "error",
          error: err.message,
        });
      }
    }

    // 3) 결과 리턴
    res.json({ message: "✅ 완료", results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/fetch-part", async (req, res) => {
  const startYear = parseInt(req.query.start, 10) || 2020;
  const endYear = parseInt(req.query.end, 10) || new Date().getFullYear();
  const startIndex = parseInt(req.query.startIndex, 10) || 0;
  const endIndex = parseInt(req.query.endIndex, 10); // 지정 안 되면 전체

  try {
    const codesPath = path.resolve(__dirname, "../kospi200_codes.json");
    const raw = await fs.readFile(codesPath, "utf8");
    const kospi200 = JSON.parse(raw); // ex: 200개 [{ _id, name }, …]

    const sliced = kospi200.slice(
      startIndex,
      endIndex !== undefined ? endIndex + 1 : kospi200.length
    );

    const results = [];

    for (const { _id: stockCode, name } of sliced) {
      try {
        const entries = await getFinancialSummary(
          stockCode,
          startYear,
          endYear
        );

        if (!entries || entries.length === 0) {
          results.push({ stockCode, name, status: "no data" });
          continue;
        }

        const corp_code = getCorpCodeByStockCode(stockCode);

        await FinancialSummary.updateOne(
          { stock_code: stockCode },
          { $set: { stock_code: stockCode, corp_code, entries } },
          { upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        results.push({
          stockCode,
          name,
          status: "saved",
          count: entries.length,
        });
      } catch (err) {
        results.push({
          stockCode,
          name,
          status: "error",
          error: err.message,
        });
      }
    }

    res.json({
      message: `✅ 완료: ${startIndex} ~ ${endIndex ?? kospi200.length - 1}`,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
