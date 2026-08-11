const Banner = require("../models/Banner");

// @route   GET /api/banners
// @desc    Public - active banners only, for the homepage
// @access  Public
const getActiveBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ displayOrder: 1 });
    res.json(banners);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/banners/all
// @desc    Admin - all banners including inactive ones
// @access  Private/Admin
const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1 });
    res.json(banners);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/banners
// @access  Private/Admin
const createBanner = async (req, res, next) => {
  try {
    const { title, imageUrl, linkUrl, displayOrder } = req.body;
    if (!title || !imageUrl) {
      res.status(400);
      throw new Error("Please provide a title and image URL");
    }
    const banner = await Banner.create({ title, imageUrl, linkUrl, displayOrder: displayOrder || 0 });
    res.status(201).json(banner);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      res.status(404);
      throw new Error("Banner not found");
    }
    const allowedFields = ["title", "imageUrl", "linkUrl", "displayOrder", "isActive"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) banner[field] = req.body[field];
    });
    const updated = await banner.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      res.status(404);
      throw new Error("Banner not found");
    }
    await banner.deleteOne();
    res.json({ message: "Banner deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner };
