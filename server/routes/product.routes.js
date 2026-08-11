const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getProductById,
  getBrands,
} = require("../controllers/product.controller");
const { addReview, updateReview, deleteReview, deleteReviewAdmin } = require("../controllers/review.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// Public routes
router.get("/", getProducts);
router.get("/brands", getBrands);

// Private routes (seller/admin only) - must be defined BEFORE "/:slug" so
// "seller" and "id" aren't mistakenly treated as a product slug
router.get("/seller/mine", protect, authorize("seller", "admin"), getMyProducts);
router.get("/id/:id", protect, authorize("seller", "admin"), getProductById);
router.post("/", protect, authorize("seller", "admin"), createProduct);
router.put("/:id", protect, authorize("seller", "admin"), updateProduct);
router.delete("/:id", protect, authorize("seller", "admin"), deleteProduct);

// Reviews (any logged-in buyer)
router.post("/:id/reviews", protect, addReview);
router.put("/:id/reviews", protect, updateReview);
router.delete("/:id/reviews", protect, deleteReview);
router.delete("/:id/reviews/:reviewId", protect, authorize("admin"), deleteReviewAdmin);

// Public route - must be LAST since ":slug" matches any single path segment
router.get("/:slug", getProductBySlug);

module.exports = router;
