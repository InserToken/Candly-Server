const axios = require("axios");
const getCorpCodeByStockCode = require("../utils/getCorpCode");
require("dotenv").config();

const FIN_URL = "https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json";
const STOCK_URL = "https://opendart.fss.or.kr/api/stockTotqySttus.json";

// 보고서 코드 → 보고서명 매핑
const REPORT_NAME = {
  11013: "1분기",
  11012: "반기",
  11014: "3분기",
  11011: "사업보고서",
  "4Q": "4분기(조정)",
};

// 분기 순서 지정 (정렬용)
const PERIOD_ORDER = {
  11013: 1, // 1분기
  11012: 2, // 반기
  11014: 3, // 3분기
  "4Q": 4, // 4분기(조정)
};

/**
 * 단일 분기 데이터 호출
 */
async function fetchSingle(stockCode, year, reprtCode) {
  const corp_code = getCorpCodeByStockCode(stockCode);
  const url =
    `${FIN_URL}?crtfc_key=${process.env.DART_API_KEY}` +
    `&corp_code=${corp_code}` +
    `&bsns_year=${year}` +
    `&reprt_code=${reprtCode}` +
    `&fs_div=CFS`;

  const { data } = await axios.get(url);
  if (data.status !== "000" || !data.list || !data.list.length) return null;

  const first = data.list[0];
  const meta = {
    rcept_no: first.rcept_no,
    bsns_year: first.bsns_year,
    reprt_code: first.reprt_code,
    report_name: REPORT_NAME[reprtCode] || "",
  };

  // XBRL 태그 기준 주요 값 검색
  const findItem = (ids, name) =>
    data.list.find((d) => ids.includes(d.account_id)) ||
    data.list.find((d) => d.account_nm.includes(name));

  const revItem = findItem(["ifrs-full_Revenue", "ifrs_Revenue"], "영업수익");
  const netItem = findItem(
    ["ifrs-full_ProfitLoss", "ifrs_ProfitLoss"],
    "당기순이익"
  );
  const govItem = findItem(
    [
      "ifrs-full_ProfitLossAttributableToOwnersOfParent",
      "ifrs_ProfitLossAttributableToOwnersOfParent",
    ],
    "지배기업소유주지분"
  );
  const opItem = findItem(["ifrs-full_OperatingIncomeLoss"], "영업이익");
  const eqItem = findItem(
    ["ifrs-full_EquityAttributableToOwnersOfParent"],
    "자본총계"
  );

  const revenue = +revItem?.thstrm_amount || 0;
  const net_profit = +netItem?.thstrm_amount || 0;
  const net_profit_govern = +govItem?.thstrm_amount || 0;
  const net_profit_non_govern = net_profit - net_profit_govern;
  const operating_profit = +opItem?.thstrm_amount || 0;
  const equity = +eqItem?.thstrm_amount || 0;

  return {
    ...meta,
    revenue,
    net_profit,
    net_profit_govern,
    net_profit_non_govern,
    operating_profit,
    equity,
  };
}

/**
 * 성장률 계산
 */
function calcRate(prev, curr) {
  if (prev == null || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

/**
 * 발행주식수 API 호출
 */
async function fetchShareCounts(corpCode, year, reprtCode) {
  const code = reprtCode === "4Q" ? "11011" : reprtCode;
  const url =
    `${STOCK_URL}?crtfc_key=${process.env.DART_API_KEY}` +
    `&corp_code=${corpCode}` +
    `&bsns_year=${year}` +
    `&reprt_code=${code}`;

  const { data } = await axios.get(url);
  if (data.status !== "000" || !data.list)
    return { istc_totqy: 0, tesstk_co: 0, distb_stock_co: 0 };

  const item = data.list.find((d) => d.se === "보통주") || data.list[0];
  const parseNum = (s) => Number(s.replace(/,/g, "")) || 0;
  return {
    istc_totqy: parseNum(item.istc_totqy),
    tesstk_co: parseNum(item.tesstk_co),
    distb_stock_co: parseNum(item.distb_stock_co),
  };
}

/**
 * 전체 재무 요약 + TTM/지표 계산
 */
async function getFinancialSummary(stockCode, startYear, endYear) {
  const flat = [];
  const corp_code = getCorpCodeByStockCode(stockCode);

  // 1) 연도별 Q1, H1, Q3, A → Q4 생성
  for (let year = startYear; year <= endYear; year++) {
    const raws = await Promise.all(
      ["11013", "11012", "11014", "11011"].map((c) =>
        fetchSingle(stockCode, year, c)
      )
    );
    const [Q1, H1, Q3, A] = raws;
    if (!Q1 || !H1 || !Q3 || !A) continue;

    const Q4 = {
      rcept_no: A.rcept_no,
      bsns_year: A.bsns_year,
      reprt_code: "4Q",
      report_name: REPORT_NAME["4Q"],
      revenue: A.revenue - H1.revenue - Q1.revenue - Q3.revenue,
      net_profit: A.net_profit - H1.net_profit - Q1.net_profit - Q3.net_profit,
      net_profit_govern:
        A.net_profit_govern -
        H1.net_profit_govern -
        Q1.net_profit_govern -
        Q3.net_profit_govern,
      operating_profit:
        A.operating_profit -
        H1.operating_profit -
        Q1.operating_profit -
        Q3.operating_profit,
      equity: A.equity,
    };
    Q4.net_profit_non_govern = Q4.net_profit - Q4.net_profit_govern;

    let prevNet = null;
    for (const q of [Q1, H1, Q3, Q4]) {
      // 마진 및 성장률
      q.profit_margin = q.revenue ? (q.net_profit / q.revenue) * 100 : null;
      q.operating_margin = q.revenue
        ? (q.operating_profit / q.revenue) * 100
        : null;
      q.growth_rate = calcRate(prevNet, q.net_profit);
      prevNet = q.net_profit;

      // 주식수
      const shares = await fetchShareCounts(
        corp_code,
        q.bsns_year,
        q.reprt_code
      );
      q.istc_totqy = shares.istc_totqy;
      q.tesstk_co = shares.tesstk_co;
      q.distb_stock_co = shares.distb_stock_co;

      flat.push(q);
    }
  }

  // 2) 정렬: 연도 오름차순 + 분기별 순서
  flat.sort((a, b) => {
    const yearDiff = parseInt(a.bsns_year) - parseInt(b.bsns_year);
    if (yearDiff !== 0) return yearDiff;
    return PERIOD_ORDER[a.reprt_code] - PERIOD_ORDER[b.reprt_code];
  });

  // 3) TTM 및 지표 추가
  const enriched = flat.map((e, i, arr) => {
    if (i < 3) return { ...e }; // 첫 3개 분기는 TTM 불가

    const last4 = arr.slice(i - 3, i + 1);
    const profit = last4.reduce((s, x) => s + x.net_profit_govern, 0);
    const revenue_ttm = last4.reduce((s, x) => s + x.revenue, 0);
    const equity_ttm = e.equity;
    const profit_diff = e.net_profit_govern - arr[i - 1].net_profit_govern;
    const profit_diff_rate = arr[i - 1].net_profit_govern
      ? (profit_diff / arr[i - 1].net_profit_govern) * 100
      : null;
    const shareCount = e.istc_totqy;
    const eps = shareCount ? profit / shareCount : null;
    const bps = shareCount ? e.equity / shareCount : null;
    const avgEquity = last4.reduce((s, x) => s + x.equity, 0) / last4.length;
    const roe = avgEquity ? (profit / avgEquity) * 100 : null;

    return {
      ...e,
      profit,
      revenue_ttm,
      equity_ttm,
      profit_diff,
      profit_diff_rate,
      eps,
      bps,
      roe,
    };
  });

  return enriched;
}

module.exports = { getFinancialSummary };
