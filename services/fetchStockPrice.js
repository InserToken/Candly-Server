// services/fetchStockPrice.js
const yf = require("yahoo-finance2").default;

/**
 * 지정일자 또는 그 이전 최대 maxFallbackDay일 중
 * 가장 가까운 거래일의 종가를 Yahoo Finance에서 가져온다.
 *
 * @param {string} stockCode      종목코드 ("035720")
 * @param {string} dateStr        조회 기준일자 ("YYYY.MM.DD")
 * @param {number} maxFallbackDay 최대 폴백 일수 (기본 7)
 * @returns {Promise<{price:number, date:string}>} 찾은 날짜(label)와 종가
 */
async function fetchStockPrice(stockCode, dateStr, maxFallbackDay = 7) {
  // "YYYY.MM.DD" → Date 객체
  const toDate = (s) => {
    const [Y, M, D] = s.split(".").map((v) => parseInt(v, 10));
    return new Date(Y, M - 1, D);
  };
  // Date → "YYYY.MM.DD" 레이블
  const toLabel = (dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
  };
  // Date → "YYYY-MM-DD" ISO 포맷 (수동)
  const toISODate = (dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const ticker = `${stockCode}.KS`; // 코스닥은 .KQ
  let cursor = toDate(dateStr);

  for (let offset = 0; offset <= maxFallbackDay; offset++) {
    const label = toLabel(cursor);
    const period1 = toISODate(cursor);

    // period2를 period1 + 1일로 설정
    const nextDay = new Date(cursor);
    nextDay.setDate(nextDay.getDate() + 1);
    const period2 = toISODate(nextDay);

    console.log(`[TRY] ${label} → ${ticker} (${period1}~${period2})`);

    try {
      const result = await yf.historical(ticker, {
        period1,
        period2,
      });
      if (result && result.length > 0) {
        const price = result[0].close;
        console.log(`✅ 찾았다! ${label} 종가 = ${price}`);
        return { price, date: label };
      }
    } catch (err) {
      console.warn(`  ⚠ 조회 실패(${period1}): ${err.message}`);
    }

    // 폴백: 하루 전으로 이동
    cursor.setDate(cursor.getDate() - 1);
  }

  throw new Error(
    `지난 ${maxFallbackDay}일 내에 주가를 찾을 수 없습니다: 시작 ${dateStr}`
  );
}

const dayjs = require("dayjs");
const PracticeChartData = require("../models/PracticeChartData");
const { getPreviousWorkDay } = require("../utils/date");

// 전날 주가 업데이트
async function fetchDailyPrice(stockCode, dateStr) {
  const prevWorkDay = await getPreviousWorkDay(dateStr); // 예: "2025-07-18"
  const ticker = `${stockCode}.KS`;
  const nextDay = dayjs(prevWorkDay).add(1, "day").format("YYYY-MM-DD");

  try {
    const result = await yf.chart(ticker, {
      period1: prevWorkDay,
      period2: nextDay,
      interval: "1d",
    });

    const candle = result?.quotes?.[0];

    if (!candle) {
      throw new Error(`주가 데이터를 찾을 수 없습니다: ${prevWorkDay}`);
    }

    const { open, close, high, low, volume } = candle;

    const updateResult = await PracticeChartData.findOneAndUpdate(
      { stock_code: stockCode },
      {
        $addToSet: {
          prices: {
            date: prevWorkDay,
            open,
            close,
            high,
            low,
            volume,
          },
        },
      },
      { upsert: true, new: true }
    );

    // console.log(`[✅ 저장 완료] ${stockCode} / ${prevWorkDay}`);
    return updateResult;
  } catch (err) {
    console.error(`[❌ 오류] fetchDailyPrice 실패: ${err.message}`);
    throw err;
  }
}

module.exports = { fetchStockPrice, fetchDailyPrice };
