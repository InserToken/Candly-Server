const mongoose = require("mongoose");

const HolidaySchema = new mongoose.Schema({
  date: { type: String, required: true },
});

module.exports = mongoose.model("Holiday", HolidaySchema);
