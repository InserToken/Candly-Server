const fetch = require("node-fetch");
const cheerio = require("cheerio");

/**
 * 네이버 금융에서 종목 코드로 현재가 크롤링
 * @param stockCode 예: "005930" (삼성전자)
 * @returns 현재 주가 (숫자)
 */
export async function getCurrentPrice(stockCode) {
  try {
    const url = `https://finance.naver.com/item/main.nhn?code=${stockCode}`;
    const res = await fetch(url);
    const html = await res.text();

    const $ = cheerio.load(html);
    const priceText = $("#chart_area > div.rate_info > div > p.no_today")
      .find("span.blind")
      .first()
      .text()
      .replace(/,/g, "");

    return parseInt(priceText, 10);
  } catch (err) {
    console.error("주가 크롤링 실패:", err);
    return null;
  }
}
