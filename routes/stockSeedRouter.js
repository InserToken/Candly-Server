const express = require("express");
const Stock = require("../models/Stocks");
const router = express.Router();

router.get("/load-stocks", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../kospi200_codes.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(rawData); // 배열 형태

    await insertStocks(jsonData);

    res.status(200).json({ message: "종목 목록 저장 완료" });
  } catch (err) {
    console.error("종목 목록 저장 실패:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/update-logos", async (req, res) => {
  try {
    const stocks = await Stock.find({}, "_id");

    const bulkOps = stocks
      .filter((stock) => stock._id)
      .map((stock) => {
        const id = stock._id.toString(); // ← 여기 핵심!
        return {
          updateOne: {
            filter: { _id: stock._id },
            update: {
              $set: {
                logo: `https://static.toss.im/png-icons/securities/icn-sec-fill-${id}.png`,
              },
            },
          },
        };
      });

    if (bulkOps.length === 0) {
      return res.status(400).json({ message: "업데이트할 항목이 없습니다." });
    }

    const result = await Stock.bulkWrite(bulkOps);

    res.status(200).json({
      message: "✅ 로고 URL 업데이트 완료",
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error("로고 업데이트 실패:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
