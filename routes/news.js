// routes/news.js
const express = require("express");
const router = express.Router();
const { importAllJson } = require("../services/newsService");

router.post("/import-news", async (req, res) => {
  try {
    await importAllJson();
    return res.json({
      success: true,
      message: "모든 JSON 파일을 DB에 저장했습니다.",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
