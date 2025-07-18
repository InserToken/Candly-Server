// services/metricsService.js
const FinancialSummary = require("../models/FinancialSummary");
const { fetchStockPrice } = require("./fetchStockPrice");

/** reprt_code → 분기 말일 매핑 */
const PERIOD_END = {
  11013: "-03-31", // 1분기
  11012: "-06-30", // 반기
  11014: "-09-30", // 3분기
  "4Q": "-12-31", // 4분기(조정)
};

function getPeriodDate(entry) {
  const suf = PERIOD_END[entry.reprt_code];
  if (!suf) throw new Error("알 수 없는 reprt_code: " + entry.reprt_code);
  return new Date(`${entry.bsns_year}${suf}`);
}

/**
 * @param {string} stockCode  종목코드
 * @param {string} dateStr    기준일자 ("YYYY.MM.DD")
 * @returns {Promise<object>} 계산된 지표들
 */
async function computeMetrics(stockCode, dateStr) {
  // 1) DB에서 불러오기
  const doc = await FinancialSummary.findOne({ stock_code: stockCode }).lean();
  if (!doc) throw new Error("금융 요약 데이터가 없습니다: " + stockCode);

  // 2) 기준일자 파싱
  const baseDate = new Date(dateStr.replace(/\./g, "-"));
  if (isNaN(baseDate)) throw new Error("잘못된 날짜 형식: " + dateStr);

  // 3) entries 에 periodDate 부착 & 기준 이전만 필터링
  const withDate = doc.entries.map((e) => ({
    ...e,
    periodDate: getPeriodDate(e),
  }));
  const valid = withDate
    .filter((e) => e.periodDate <= baseDate)
    .sort((a, b) => a.periodDate - b.periodDate);

  if (valid.length < 2) throw new Error("조회일자 이전에 분기가 부족합니다");

  // 4) 최근 4분기, 현재·직전
  const ttmEntries = valid.slice(-4);
  const curr = ttmEntries[ttmEntries.length - 1];
  const prev = valid[valid.length - 2];

  // 5) TTM 합산 및 평균자본
  const ttmProfit = ttmEntries.reduce((s, e) => s + e.net_profit_govern, 0);
  const ttmRevenue = ttmEntries.reduce((s, e) => s + e.revenue, 0);
  const avgEquity =
    ttmEntries.reduce((s, e) => s + e.equity, 0) / ttmEntries.length;
  const ttmequity = curr.equity;
  const shareCount = curr.istc_totqy; // 총 발행 주식수

  // 6) 주가 조회 → 숫자만 꺼내서
  const { price: stockPrice, date: priceDate } = await fetchStockPrice(
    stockCode,
    dateStr
  );

  // 7) 지표 계산
  const eps = shareCount ? ttmProfit / shareCount : null;
  const per = eps ? stockPrice / eps : null;
  const psr = ttmRevenue ? (stockPrice * shareCount) / ttmRevenue : null;
  const bps = shareCount ? ttmequity / shareCount : null;
  const pbr = bps ? stockPrice / bps : null;
  const roe = avgEquity ? (ttmProfit / avgEquity) * 100 : null;

  // 8) 분기별 증감
  const changeAmount = curr.net_profit_govern - prev.net_profit_govern;
  const changeRate = prev.net_profit_govern
    ? (changeAmount / prev.net_profit_govern) * 100
    : null;

  return {
    price: { price: stockPrice, date: priceDate },
    ttmProfit,
    ttmRevenue,
    ttmequity,
    shareCount,
    eps,
    per,
    psr,
    bps,
    pbr,
    roe,
    changeAmount,
    changeRate,
  };
}

module.exports = { computeMetrics };
