// db에 공휴일+주말 추가 (공공api + getDay)
const axios = require("axios");
const mongoose = require("mongoose");
const Holiday = require("../models/Holiday");
const { format } = require("date-fns");
const toDashDate = require("../utils/date").default;
require("dotenv").config();

mongoose.connect(process.env.DB_URI);

// 공공api
async function fetchOfficialHolidays(year) {
  const serviceKey = process.env.HOLIDAY_API_KEY;
  const url = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?solYear=${year}&numOfRows=30&ServiceKey=${serviceKey}`;

  try {
    const response = await axios.get(url, {
      responseType: "text",
      headers: { Accept: "application/xml" },
    });
    const xml = response.data;

    // XML 파싱
    const { XMLParser } = require("fast-xml-parser");
    const parser = new XMLParser({ ignoreAttributes: false });
    const json = parser.parse(xml);
    if (!json.response || !json.response.body || !json.response.body.items) {
      console.error(
        "❌ API 응답 구조가 예상과 다릅니다:",
        JSON.stringify(json, null, 2)
      );
      return [];
    }

    const items = json.response.body.items.item;

    if (!items) return [];

    const holidays = Array.isArray(items) ? items : [items];

    return holidays.map((item) => toDashDate(String(item.locdate)));
  } catch (error) {
    console.error("공휴일 API 호출 실패:", error.message);
    return [];
  }
}

// 주말 날짜 계산
function getWeekendDates(year) {
  const weekends = [];

  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year}-12-31`);

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const day = date.getDay();
    if (day === 0 || day === 6) {
      weekends.push(toDashDate(format(date, "yyyyMMdd")));
    }
  }

  return weekends;
}

// 중복 없이 저장
async function saveHolidaysToDB(year) {
  const [apiHolidays, weekends] = await Promise.all([
    fetchOfficialHolidays(year),
    getWeekendDates(year),
  ]);

  const allDatesSet = new Set([...apiHolidays, ...weekends]);

  const bulkOps = Array.from(allDatesSet).map((dateStr) => ({
    updateOne: {
      filter: { date: dateStr },
      update: { $setOnInsert: { date: dateStr } },
      upsert: true,
    },
  }));

  try {
    const result = await Holiday.bulkWrite(bulkOps);
    console.log(`✅ ${year}년의 휴장일 ${bulkOps.length}건 저장 또는 갱신됨`);
    return result;
  } catch (err) {
    console.error("DB 저장 오류:", err.message);
  }
}

// node 명령어로 직접 실행될 때만 작동
if (require.main === module) {
  const year = "2026";
  saveHolidaysToDB(year).then(() => {
    console.log("✅ 완료");
    process.exit(0);
  });
}
