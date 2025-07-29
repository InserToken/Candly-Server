const mongoose = require("mongoose");

const realScoreSchema = new mongoose.Schema({
  user_stock_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserStock",
    required: true,
  },
  score: { type: Number },
  date: { type: Date },
});

module.exports = mongoose.model("RealScore", realScoreSchema);
