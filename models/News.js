// models/PracticeNews.js

const mongoose = require("mongoose");
const { Schema, models, model } = mongoose;

// 뉴스 아이템 서브스키마
const NewsItemSchema = new Schema(
  {
    date: { type: String, required: true },
    title: { type: String, required: true },
    context: { type: String, required: true },
    news_url: { type: String, required: true },
    img_url: { type: String },
  },
  { _id: false }
);

// 메인 스키마
const PracticeNewsSchema = new Schema(
  {
    problem_id: { type: String, required: true, index: true },
    stockName: { type: String, required: true },
    date: { type: String, required: true },
    news: { type: [NewsItemSchema], default: [] },
  },
  { timestamps: true }
);

// 이미 컴파일된 모델이 있으면 재사용, 없으면 새로 정의
module.exports = models.PracticeNews
  ? models.PracticeNews
  : model("PracticeNews", PracticeNewsSchema);
