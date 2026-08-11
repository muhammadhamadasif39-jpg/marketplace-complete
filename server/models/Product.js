const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    // e.g. { size: "M", color: "Red", stock: 20, priceModifier: 0 }
    size: String,
    color: String,
    stock: { type: Number, default: 0 },
    priceModifier: { type: Number, default: 0 }, // extra cost for this variant
    sku: String,
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    images: [
      {
        type: String, // Cloudinary URLs
      },
    ],
    productType: {
      type: String,
      enum: ["physical", "digital"],
      default: "physical",
    },
    variants: [variantSchema],
    stock: {
      // Total stock (used when no variants)
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      // New products need admin approval before showing up in public listings.
      // Sellers can still see their own unapproved products in their dashboard.
      type: Boolean,
      default: false,
    },
    reviews: [reviewSchema],
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    tags: [String],
    shippingWeight: Number,
  },
  { timestamps: true }
);

// Text index for search functionality
productSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
