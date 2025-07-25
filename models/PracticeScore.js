const mongoose = require("mongoose");

const practiceScoreSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  problem_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PracticeProblems",
    required: true,
  },
  answer: String,
  feedback: String,
  score: Number,
  logic: Number,
  technical: Number,
  macroEconomy: Number,
  marketIssues: Number,
  quantEvidence: Number,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PracticeScore", practiceScoreSchema);
