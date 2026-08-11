const Product = require("../models/Product");
const Order = require("../models/Order");

// Recalculates and saves a product's average rating from its current reviews
async function recalculateRating(product) {
  const count = product.reviews.length;
  const average = count === 0 ? 0 : product.reviews.reduce((sum, r) => sum + r.rating, 0) / count;
  product.rating.count = count;
  product.rating.average = Math.round(average * 10) / 10; // one decimal place
  await product.save();
}

// @route   POST /api/products/:id/reviews
// @desc    Add a review - only buyers who actually received this product in a delivered order can review
// @access  Private
const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400);
      throw new Error("Rating must be between 1 and 5");
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const alreadyReviewed = product.reviews.some((r) => r.user.equals(req.user._id));
    if (alreadyReviewed) {
      res.status(400);
      throw new Error("You have already reviewed this product. You can edit your existing review instead.");
    }

    // Verified-purchase check: only let people who actually received this product review it
    const hasDeliveredOrder = await Order.exists({
      buyer: req.user._id,
      orderStatus: "delivered",
      "items.product": product._id,
    });
    if (!hasDeliveredOrder) {
      res.status(403);
      throw new Error("You can only review products from orders that have been delivered to you");
    }

    product.reviews.push({ user: req.user._id, rating, comment: comment || "" });
    await recalculateRating(product);

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/products/:id/reviews
// @desc    Edit the logged-in user's own review on this product
// @access  Private
const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const review = product.reviews.find((r) => r.user.equals(req.user._id));
    if (!review) {
      res.status(404);
      throw new Error("You haven't reviewed this product yet");
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        res.status(400);
        throw new Error("Rating must be between 1 and 5");
      }
      review.rating = rating;
    }
    if (comment !== undefined) review.comment = comment;

    await recalculateRating(product);

    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/products/:id/reviews
// @desc    Delete the logged-in user's own review
// @access  Private
const deleteReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const hadReview = product.reviews.some((r) => r.user.equals(req.user._id));
    if (!hadReview) {
      res.status(404);
      throw new Error("You haven't reviewed this product yet");
    }

    product.reviews = product.reviews.filter((r) => !r.user.equals(req.user._id));
    await recalculateRating(product);

    res.json({ message: "Review deleted", product });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/products/:id/reviews/:reviewId
// @desc    Admin moderation - remove any review (e.g. abusive/spam content)
// @access  Private/Admin
const deleteReviewAdmin = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    product.reviews = product.reviews.filter((r) => r._id.toString() !== req.params.reviewId);
    await recalculateRating(product);

    res.json({ message: "Review removed by admin", product });
  } catch (error) {
    next(error);
  }
};

module.exports = { addReview, updateReview, deleteReview, deleteReviewAdmin };
