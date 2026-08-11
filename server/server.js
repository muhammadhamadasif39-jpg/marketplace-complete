require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/error.middleware");
const { stripeWebhook } = require("./controllers/payment.controller");

// Connect to MongoDB
connectDB();

const app = express();

// --- Stripe webhook: MUST be registered before express.json(), because Stripe's
// signature verification needs the exact raw request bytes, not a parsed/re-serialized body.
app.post("/api/payments/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// --- Core middleware ---
app.use(express.json({ limit: "10mb" })); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // JazzCash/Easypaisa post back as form data, not JSON
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Basic rate limiting to protect against abuse/brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  message: { message: "Too many requests, please try again later" },
});
app.use("/api", limiter);

// --- Routes ---
app.get("/", (req, res) => {
  res.json({ message: "Marketplace API is running 🚀" });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/sellers", require("./routes/seller.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/wishlist", require("./routes/wishlist.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/coupons", require("./routes/coupon.routes"));
app.use("/api/banners", require("./routes/banner.routes"));
app.use("/api/upload", require("./routes/upload.routes"));

// Serves locally-uploaded images when Cloudinary isn't configured (see upload.controller.js)
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
