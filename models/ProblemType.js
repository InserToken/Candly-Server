const mongoose = require("mongoose");

const problemTypeSchema = new mongoose.Schema({
  id: Number,
  Prompting: String,
  hint: String,
  reference: String,
});

module.exports = mongoose.model("ProblemTypes", problemTypeSchema);
