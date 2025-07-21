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
  // DB에서 불러오기
  const doc = await FinancialSummary.findOne({ stock_code: stockCode }).lean();
  if (!doc) throw new Error("금융 요약 데이터가 없습니다: " + stockCode);

  // 기준일자 파싱
  const baseDate = new Date(dateStr.replace(/\./g, "-"));
  // console.log(baseDate);
  if (isNaN(baseDate)) throw new Error("잘못된 날짜 형식: " + dateStr);

  // entries 에 periodDate 부착 & 기준 이전만 필터링
  const withDate = doc.entries.map((e) => ({
    ...e,
    periodDate: getPeriodDate(e),
  }));
  const valid = withDate
    .filter((e) => e.periodDate <= baseDate)
    .sort((a, b) => a.periodDate - b.periodDate);

  if (valid.length < 2) throw new Error("조회일자 이전에 분기가 부족합니다");

  // TTM 합산 및 평균자본
  const { price: stockPrice, date: priceDate } = await fetchStockPrice(
    stockCode,
    dateStr
  );

  const ttmProfit = valid[valid.length - 1].profit; //당기 순이익
  const ttmRevenue = valid[valid.length - 1].revenue_ttm; //매출액
  const ttmequity = valid[valid.length - 1].equity_ttm; // 순자산
  const shareCount = valid[valid.length - 1].istc_totqy; // 총 발행 주식수
  const profit_diff = valid[valid.length - 1].profit_diff; // 증감액
  const profit_diff_rate = valid[valid.length - 1].profit_diff_rate; // 증감률
  // const revenue = valid[valid.length - 1].revenue;
  // const netProfit_govern = valid[valid.length - 1].net_profit_govern; // 순이익
  // const profitMargin = valid[valid.length - 1].profit_margin; // 순 이익률
  // const growthRate = valid[valid.length - 1].growth_rate; //순 이익 성장률
  // const operatingProfit = valid[valid.length - 1].operating_profit; // 영업 이익
  // const operatingMargin = valid[valid.length - 1].operating_margin; // 영업 이익률
  // const operatingGrowthRate = valid[valid.length - 1].operating_growth_rate; // 영업 이익 성장률

  // 지표 계산
  const eps = valid[valid.length - 1].eps;
  const bps = valid[valid.length - 1].bps;
  const roe = valid[valid.length - 1].roe;

  const pbr = bps ? stockPrice / bps : null;
  const per = eps ? stockPrice / eps : null;
  const psr = ttmRevenue ? (stockPrice * shareCount) / ttmRevenue : null;

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
    psr,
    pbr,
    eps,
    bps,
    roe,
    ttmProfit,
    ttmRevenue,
    ttmequity,
    profit_diff,
    profit_diff_rate,
    series,
  };
}

module.exports = { computeMetrics };
