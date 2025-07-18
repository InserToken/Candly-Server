const mongoose = require("mongoose");

const EntrySchema = new mongoose.Schema(
  {
    // 원본 재무제표 데이터
    rcept_no: { type: String, default: "" }, // 접수번호
    bsns_year: { type: String, default: "" }, // 사업연도 (예: "2023")
    reprt_code: { type: String, default: "" }, // 보고서 코드 (11013:1분기, 11012:반기, 11014:3분기, 11011:사업보고서, "4Q":4분기 조정)
    report_name: { type: String, default: "" }, // 보고서명 (예: "3분기")
    revenue: { type: Number, default: 0 }, // 해당 분기 매출액
    net_profit: { type: Number, default: 0 }, // 해당 분기 당기순이익 (전체)
    net_profit_govern: { type: Number, default: 0 }, // 해당 분기 지배주주지분 당기순이익
    net_profit_non_govern: { type: Number, default: 0 }, // 해당 분기 비지배주주지분 당기순이익
    profit_margin: { type: Number, default: null }, // 순이익률 (%) = net_profit / revenue * 100
    growth_rate: { type: Number, default: null }, // 전분기 대비 순이익 성장률 (%) = (curr – prev) / |prev| * 100
    operating_profit: { type: Number, default: 0 }, // 해당 분기 영업이익
    operating_margin: { type: Number, default: null }, // 영업이익률 (%) = operating_profit / revenue * 100
    operating_growth_rate: { type: Number, default: null }, // 전분기 대비 영업이익 성장률 (%)
    equity: { type: Number, default: 0 }, // 해당 분기 말 총자본(지배주주지분)

    // 발행주식 관련
    istc_totqy: { type: Number, default: 0 }, // 총 발행주식수
    tesstk_co: { type: Number, default: 0 }, // 자기주식수
    distb_stock_co: { type: Number, default: 0 }, // 유통주식수

    // ─── 추가된 TTM / 지표 필드 ─────────────────────────
    profit: { type: Number, default: null }, // TTM(최근 4분기) 지배주주지분 당기순이익 합
    revenue_ttm: { type: Number, default: null }, // TTM(최근 4분기) 매출 합
    equity_ttm: { type: Number, default: null }, // 해당 분기 말 순자산(지배주주지분)
    profit_diff: { type: Number, default: null }, // 증감액 = 현 분기 지배주주지분 당기순이익 - 직전 분기 지배주주지분 당기순이익
    profit_diff_rate: { type: Number, default: null }, // 증감률 (%) = profit_diff / (직전 분기 지배주주지분 당기순이익) * 100
    eps: { type: Number, default: null }, // 주당순이익 = TTM 지배주주지분 당기순이익 합 / 총 발행주식수
    bps: { type: Number, default: null }, // 주당순자산 = 해당 분기 순자산(지배주주지분) / 총 발행주식수
    roe: { type: Number, default: null }, // 자기자본이익률 (%) = TTM 지배주주지분 당기순이익 합 / (최근 4분기 순자산 평균) * 100
  },
  { _id: false }
);

const FinancialSummarySchema = new mongoose.Schema(
  {
    stock_code: { type: String, required: true, unique: true }, // 종목 코드
    corp_code: { type: String, default: "" }, // DART 고유 법인 코드
    entries: { type: [EntrySchema], default: [] }, // 분기별 항목 배열
  },
  { timestamps: true }
);

module.exports = mongoose.model("FinancialSummary", FinancialSummarySchema);
