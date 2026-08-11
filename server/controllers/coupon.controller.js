const Coupon = require("../models/Coupon");

// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiresAt) {
      res.status(400);
      throw new Error("Please provide code, discount type, discount value, and expiry date");
    }
    if (discountType === "percentage" && discountValue > 100) {
      res.status(400);
      throw new Error("Percentage discount cannot exceed 100");
    }

    const exists = await Coupon.findOne({ code: code.toUpperCase() });
    if (exists) {
      res.status(400);
      throw new Error("A coupon with this code already exists");
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxUses: maxUses || null,
      expiresAt,
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found");
    }

    const allowedFields = ["discountValue", "minOrderAmount", "maxUses", "expiresAt", "isActive"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) coupon[field] = req.body[field];
    });

    const updated = await coupon.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found");
    }
    await coupon.deleteOne();
    res.json({ message: "Coupon deleted" });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/coupons/validate
// @desc    Buyer checks whether a code is valid for their current order total
// @access  Private
const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) {
      res.status(400);
      throw new Error("Please provide a coupon code");
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon || !coupon.isActive) {
      res.status(404);
      throw new Error("Invalid or inactive coupon code");
    }
    if (coupon.expiresAt < new Date()) {
      res.status(400);
      throw new Error("This coupon has expired");
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      res.status(400);
      throw new Error("This coupon has reached its usage limit");
    }
    if (orderTotal < coupon.minOrderAmount) {
      res.status(400);
      throw new Error(`This coupon requires a minimum order of Rs. ${coupon.minOrderAmount}`);
    }

    const discount =
      coupon.discountType === "percentage"
        ? Math.round((orderTotal * coupon.discountValue) / 100)
        : coupon.discountValue;

    res.json({ code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, discount });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon };
