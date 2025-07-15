const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  name: { type: String },
  state: { type: Boolean },
  listing_date: { type: String },
  index: { type: String },
});

module.exports = mongoose.model("Stocks", stockSchema);
