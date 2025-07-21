const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    close: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const RealInputDatachema = new mongoose.Schema({
  user_stock_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserStock",
    required: true,
  },

  prediction: { type: [PredictionSchema], required: true },
});

module.exports = mongoose.model("RealInputData", RealInputDatachema);
