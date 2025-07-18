const mongoose = require("mongoose");

const newsListSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    context: {
      type: String,
      required: true,
    },
    news_url: {
      type: String,
      required: true,
    },
    img_url: {
      type: String,
    },
  },
  { _id: true }
);

const practiceNewsSchema = new mongoose.Schema({
  problem_id: { type: String, required: true },
  stockName: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  news: [newsListSchema],
});

module.exports = mongoose.model("PracticeNews", practiceNewsSchema);
