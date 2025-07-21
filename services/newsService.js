// services/newsService.js
const fs = require("fs");
const path = require("path");
const ProblemNews = require("../models/News");

const RESULT_DIR = path.join(__dirname, "..", "result_5");

async function importAllJson() {
  const files = fs.readdirSync(RESULT_DIR).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const fullPath = path.join(RESULT_DIR, file);
    let records;
    try {
      records = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    } catch (err) {
      console.error(`❌ JSON 파싱 실패: ${file}`, err);
      continue;
    }

    for (const rec of records) {
      try {
        // upsert: 같은 problem_id 가 있으면 덮어쓰기
        await ProblemNews.updateOne(
          { problem_id: rec.problem_id },
          {
            $set: {
              stockName: rec.stockName,
              date: rec.date,
              news: rec.news,
            },
          },
          { upsert: true }
        );
      } catch (err) {
        console.error(`❌ DB 저장 실패: problem_id=${rec.problem_id}`, err);
      }
    }
    console.log(`✅ ${file} → ${records.length}건 처리`);
  }
}

module.exports = { importAllJson };
