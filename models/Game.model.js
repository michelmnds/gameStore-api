const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true, trim: true },
  imageUrl: { type: String, required: true },
  developer: { type: String, required: true, trim: true },
  publisher: { type: String, required: true, trim: true },
  releaseDate: { type: String, required: true },
  tags: { type: [String], default: [] },
  reviews: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
  price: { type: { String }, required: true },
  description: { type: String, required: true, trim: true },
});

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;
