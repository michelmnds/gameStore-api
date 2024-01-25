const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  game: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
  recommend: { type: Boolean, required: true },
  comment: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
