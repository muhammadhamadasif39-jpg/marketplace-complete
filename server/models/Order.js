const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    title: String, // snapshot of product title at time of order
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }, // price at time of purchase
    variant: {
      size: String,
      color: String,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      street: String,
      city: String,
      country: String,
      postalCode: String,
      phone: String,
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal", "jazzcash", "easypaisa", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    // Short reference sent to the payment gateway (JazzCash/Easypaisa have strict length/format
    // limits on their transaction reference field, so we don't send them the raw Mongo _id).
    paymentTxnRef: {
      type: String,
      default: "",
    },
    // Raw response from the gateway callback - kept for debugging/audit, never shown to buyers.
    gatewayRawResponse: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
    },
    orderStatus: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    trackingNumber: {
      type: String,
      default: "",
    },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
