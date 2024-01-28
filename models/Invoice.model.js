const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fromOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    appliesToAlreadyDiscoutedGames: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
