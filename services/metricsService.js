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
  // DB에서 불러오기
  const doc = await FinancialSummary.findOne({ stock_code: stockCode }).lean();
  if (!doc) throw new Error("금융 요약 데이터가 없습니다: " + stockCode);

  // 기준일자 파싱
  const baseDate = new Date(dateStr.replace(/\./g, "-"));
  if (isNaN(baseDate)) throw new Error("잘못된 날짜 형식: " + dateStr);

  // entries에 periodDate 부착 & 기준 이전만 필터
  const valid = doc.entries
    .map((e) => ({ ...e, periodDate: getPeriodDate(e) }))
    .filter((e) => e.periodDate <= baseDate)
    .sort((a, b) => a.periodDate - b.periodDate);

  // 최소 4분기 데이터 확보
  if (valid.length < 4) {
    throw new Error("4분기 이상 데이터가 필요합니다.");
  }

  // 최신 분기 데이터
  const last = valid[valid.length - 1];

  // TTM 합산값과 주식수
  const profit = last.profit;
  const ttmRevenue = last.revenue_ttm;
  const equityTTM = last.equity_ttm;
  const shareCount = last.istc_totqy;

  if (!profit || !ttmRevenue || !shareCount) {
    throw new Error("TTM 데이터가 부족하여 EPS/BPS/PSR 계산이 불가능합니다.");
  }

  // EPS/BPS 보정 계산
  const eps = last.eps != null ? last.eps : profit / shareCount;
  const bps = last.bps != null ? last.bps : last.equity / shareCount;

  // 주가 가져오기
  const { price: stockPrice, date: priceDate } = await fetchStockPrice(
    stockCode,
    dateStr
  );

  // 지표 계산
  const per = eps ? stockPrice / eps : null;
  const pbr = bps ? stockPrice / bps : null;
  const psr = ttmRevenue ? (stockPrice * shareCount) / ttmRevenue : null;

  // 시계열 데이터
  const series = {
    period: valid.map((e) => `${e.bsns_year}.${e.reprt_code}`),
    revenue: valid.map((e) => e.revenue),
    netProfit_govern: valid.map((e) => e.net_profit_govern),
    profitMargin: valid.map((e) => e.profit_margin),
    growthRate: valid.map((e) => e.growth_rate),
    operatingProfit: valid.map((e) => e.operating_profit),
    operatingMargin: valid.map((e) => e.operating_margin),
    operatingGrowthRate: valid.map((e) => e.operating_growth_rate),
  };

  return {
    price: { price: stockPrice, date: priceDate },
    per,
    pbr,
    psr,
    eps,
    bps,
    roe: last.roe,
    ttmProfit: profit,
    ttmRevenue,
    equityTTM,
    profit_diff: last.profit_diff,
    profit_diff_rate: last.profit_diff_rate,
    series,
  };
}

module.exports = { computeMetrics };
