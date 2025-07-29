const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

function getCorpCodeByStockCode(stockCode) {
  const filePath = path.resolve(__dirname, "../CORPCODE.xml");
  const xmlData = fs.readFileSync(filePath, "utf-8");

  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const json = parser.parse(xmlData);
  const corpList = json.result?.list || json.list;

  const matched = corpList.find(
    (item) => String(item.stock_code).padStart(6, "0") === stockCode
  );

  if (!matched) {
    throw new Error(`❌ ${stockCode}에 해당하는 corp_code를 찾을 수 없습니다.`);
  }

  return String(matched.corp_code).padStart(8, "0");
}

module.exports = getCorpCodeByStockCode;
