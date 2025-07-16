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

module.exports = mongoose.model("UserStocks", userStockSchema);
