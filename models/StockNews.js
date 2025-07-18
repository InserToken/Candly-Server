const mongoose = require("mongoose");

const practiceNewsSchema = new mongoose.Schema({
  problem_id: { type: String, required: true },
  stockName: { type: String, required: true },
  date: { type: String, required: true }, // "YYYY.MM.DD"
  news: [
    {
      date: String,
      title: String,
      context: String,
      news_url: String,
      img_url: String,
    },
  ],
});

module.exports = mongoose.model("PracticeNews", practiceNewsSchema);
