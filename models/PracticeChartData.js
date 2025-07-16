const mongoose = require("mongoose");

const priceSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    open: {
      type: Number,
      required: true,
    },
    close: {
      type: Number,
      required: true,
    },
    high: {
      type: Number,
      required: true,
    },
    low: {
      type: Number,
      required: true,
    },
    volume: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const practiceChartDataSchema = new mongoose.Schema({
  stock_code: {
    type: String,
    required: true,
  },
  prices: [priceSchema],
});

module.exports =
  mongoose.models.PracticeChartData ||
  mongoose.model("PracticeChartData", practiceChartDataSchema);
