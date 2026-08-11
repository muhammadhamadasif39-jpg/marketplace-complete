const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Helper: get or create a cart for the logged-in user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      select: "title price discountPrice images stock isPublished seller",
    });

    if (!cart) {
      return res.json({ items: [] });
    }

    res.json(cart);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/cart
// @desc    Add an item to cart (or increase quantity if it already exists)
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    if (!productId) {
      res.status(400);
      throw new Error("Product ID is required");
    }

    const product = await Product.findById(productId);
    if (!product || !product.isPublished) {
      res.status(404);
      throw new Error("Product not found or unavailable");
    }

    const cart = await getOrCreateCart(req.user._id);

    // Check if this exact product + variant combo is already in the cart
    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.variant?.size === variant?.size &&
        item.variant?.color === variant?.color
    );

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity), variant });
    }

    await cart.save();
    const populated = await cart.populate({
      path: "items.product",
      select: "title price discountPrice images stock",
    });

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/cart/:productId
// @desc    Update quantity of a specific cart item
// @access  Private
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      res.status(400);
      throw new Error("Quantity must be at least 1");
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error("Cart not found");
    }

    const item = cart.items.find((i) => i.product.toString() === req.params.productId);
    if (!item) {
      res.status(404);
      throw new Error("Item not found in cart");
    }

    item.quantity = Number(quantity);
    await cart.save();

    const populated = await cart.populate({
      path: "items.product",
      select: "title price discountPrice images stock",
    });
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error("Cart not found");
    }

    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    await cart.save();

    res.json({ message: "Item removed from cart", cart });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/cart
// @desc    Clear entire cart (used after successful checkout)
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ message: "Cart cleared" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
