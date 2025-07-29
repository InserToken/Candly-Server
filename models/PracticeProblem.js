const mongoose = require("mongoose");

const practiceProblemSchema = new mongoose.Schema({
  stock_code: { type: String, ref: "Stocks", required: true },
  problemtype: { type: Number, required: true },
  title: { type: String },
  date: { type: Date },
});

module.exports = mongoose.model("PracticeProblems", practiceProblemSchema);
