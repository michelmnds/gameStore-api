const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: [String], required: true }, //turn into array - index 0 is always thumbnail image
    developer: { type: String, required: true, trim: true },
    publisher: { type: String, required: true, trim: true },
    releaseDate: { type: String, required: true },
    tags: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviews: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Review",
      default: [],
    },
    price: { type: Number, required: true },
    discountInPercent: { type: Number, default: 0 },
    currency: { type: String, default: "EUR" },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;
