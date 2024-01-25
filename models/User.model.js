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
  reviews: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
