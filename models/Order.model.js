const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
        defaultPriceInEuroCent: { type: Number },
        discountPercentApplied: { type: Number },
        finalItemPrice: { type: Number },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      default: "PENDING",
      enum: ["PENDING", "SUCCESS", "FAILED"],
    },
    totalInEuroCentBeforeDiscount: { type: Number },
    totalInEuroCentAfterDiscount: { type: Number },
    currency: { type: String, default: "EUR" },
    discountcode: { type: String, default: "" },
    discountCodePercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
