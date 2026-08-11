const Seller = require("../models/Seller");
const User = require("../models/User");

// @route   POST /api/sellers/register
// @desc    Turn a logged-in buyer account into a seller by creating a store
// @access  Private
const registerStore = async (req, res, next) => {
  try {
    const { storeName, description } = req.body;

    if (!storeName) {
      res.status(400);
      throw new Error("Store name is required");
    }

    const existingStore = await Seller.findOne({ user: req.user._id });
    if (existingStore) {
      res.status(400);
      throw new Error("You already have a seller store");
    }

    const storeSlug = storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const slugTaken = await Seller.findOne({ storeSlug });
    if (slugTaken) {
      res.status(400);
      throw new Error("This store name is already taken, please choose another");
    }

    const seller = await Seller.create({
      user: req.user._id,
      storeName,
      storeSlug,
      description: description || "",
    });

    // Upgrade the user's role to "seller"
    await User.findByIdAndUpdate(req.user._id, { role: "seller" });

    res.status(201).json(seller);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/sellers/me
// @access  Private/Seller
const getMyStore = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      res.status(404);
      throw new Error("No seller store found for this account");
    }
    res.json(seller);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/sellers/:slug
// @desc    Public store profile page
// @access  Public
const getStoreBySlug = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ storeSlug: req.params.slug, isActive: true });
    if (!seller) {
      res.status(404);
      throw new Error("Store not found");
    }
    res.json(seller);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/sellers/me
// @desc    Update the logged-in seller's own store settings
// @access  Private/Seller
const updateMyStore = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      res.status(404);
      throw new Error("No seller store found for this account");
    }

    const allowedFields = ["description", "storeLogo", "storeBanner"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) seller[field] = req.body[field];
    });

    const updated = await seller.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = { registerStore, getMyStore, getStoreBySlug, updateMyStore };
