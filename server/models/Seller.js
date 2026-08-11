const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    user: {
      // Links to the User account (role: 'seller')
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      unique: true,
    },
    storeSlug: {
      // URL-friendly version, e.g. "hamad-fashion-store"
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    storeLogo: {
      type: String,
      default: "",
    },
    storeBanner: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    commissionRate: {
      // % commission the marketplace takes, admin-configurable
      type: Number,
      default: 10,
    },
    bankDetails: {
      accountTitle: String,
      accountNumber: String,
      bankName: String,
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seller", sellerSchema);
