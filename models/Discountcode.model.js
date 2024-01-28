const mongoose = require("mongoose");

const discountcodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    discountInPercent: { type: Number, default: 0 },
    appliesToAlreadyDiscoutedGames: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Discountcode = mongoose.model("Discountcode", discountcodeSchema);

module.exports = Discountcode;
