const Holiday = require("../models/Holiday");
const dayjs = require("dayjs");
// '20250101' -> '2025-01-01'
function toDashDate(compact) {
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

// 오늘날짜 '2025.01.01.'
function getTodayStr() {
  const now = new Date();
  const kstNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );

  const yyyy = kstNow.getFullYear();
  const mm = String(kstNow.getMonth() + 1).padStart(2, "0");
  const dd = String(kstNow.getDate()).padStart(2, "0");

  return `${yyyy}.${mm}.${dd}`;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

// 주어진 날짜 이전의 직전 영업일을 반환
async function getPreviousWorkDay(dateStr) {
  const holidays = await Holiday.find({});
  const holidaySet = new Set(holidays.map((h) => h.date)); // Set for O(1) lookup

  let current = dayjs(dateStr).subtract(1, "day");

  while (holidaySet.has(current.format("YYYY-MM-DD"))) {
    current = current.subtract(1, "day");
  }

  return current.format("YYYY-MM-DD");
}

module.exports = { toDashDate, getTodayStr, formatDate, getPreviousWorkDay };
