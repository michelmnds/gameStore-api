const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, trim: true },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: { type: String, required: true },
  reviews: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Review",
    default: [],
  },
  cart: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Game",
    default: [],
  },
  roles: {
    type: [String],
    enum: ["ADMIN", "ENDUSER", "GAMEDEVELOPER"],
    default: ["ENDUSER"],
  },
  ownedGames: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Game",
    default: [],
  },
  wishlistedGames: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Game",
    default: [],
  },
  imageUrl: String,
  otp_enabled: { type: Boolean, default: false },
  otp_verified: { type: Boolean, default: false },
  otp_ascii: String,
  otp_hex: String,
  otp_base32: String,
  otp_auth_url: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
