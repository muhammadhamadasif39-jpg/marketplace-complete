const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
      "products",
      "title price discountPrice images rating"
    );
    res.json(wishlist || { products: [] });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/wishlist/:productId
// @access  Private
const addToWishlist = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    // Avoid duplicates
    if (!wishlist.products.some((p) => p.toString() === req.params.productId)) {
      wishlist.products.push(req.params.productId);
      await wishlist.save();
    }

    res.status(201).json(wishlist);
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      res.status(404);
      throw new Error("Wishlist not found");
    }

    wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
    await wishlist.save();

    res.json({ message: "Removed from wishlist", wishlist });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
