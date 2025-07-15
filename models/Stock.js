const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // stock_code
  name: { type: String, required: true },
});

module.exports = mongoose.model("Stock", stockSchema, "stocks");
