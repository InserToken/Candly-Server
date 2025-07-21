const mongoose = require("mongoose");

const userStockSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  stock_code: { type: String, ref: "Stocks", required: true },
  cumulative_score: { type: Number },
});

userStockSchema.index({ user_id: 1, stock_code: 1 }, { unique: true });
module.exports = mongoose.model("UserStock", userStockSchema);
