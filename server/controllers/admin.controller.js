const User = require("../models/User");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Order = require("../models/Order");

// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalSellers, pendingSellers, totalProducts, totalOrders, revenueAgg] =
      await Promise.all([
        User.countDocuments({ role: "buyer" }),
        Seller.countDocuments(),
        Seller.countDocuments({ verificationStatus: "pending" }),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
      ]);

    res.json({
      totalUsers,
      totalSellers,
      pendingSellers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueAgg[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/admin/users/:id/status
// @desc    Activate or deactivate a user account
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    // Prevent an admin from accidentally locking themselves out
    if (req.params.id === req.user._id.toString() && isActive === false) {
      res.status(400);
      throw new Error("You cannot deactivate your own account");
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.isActive = isActive;
    await user.save();

    res.json({ _id: user._id, isActive: user.isActive });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/sellers
// @access  Private/Admin
const getAllSellers = async (req, res, next) => {
  try {
    const sellers = await Seller.find().populate("user", "name email isActive").sort({ createdAt: -1 });
    res.json(sellers);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/admin/sellers/:id/verification
// @desc    Approve or reject a seller's store
// @access  Private/Admin
const updateSellerVerification = async (req, res, next) => {
  try {
    const { verificationStatus } = req.body;
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(verificationStatus)) {
      res.status(400);
      throw new Error("Invalid verification status");
    }

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      res.status(404);
      throw new Error("Seller not found");
    }

    seller.verificationStatus = verificationStatus;
    await seller.save();

    res.json(seller);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/admin/sellers/:id/commission
// @desc    Set a seller's commission rate (% the marketplace takes per sale)
// @access  Private/Admin
const updateSellerCommission = async (req, res, next) => {
  try {
    const { commissionRate } = req.body;
    if (commissionRate === undefined || commissionRate < 0 || commissionRate > 100) {
      res.status(400);
      throw new Error("Commission rate must be between 0 and 100");
    }

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      res.status(404);
      throw new Error("Seller not found");
    }

    seller.commissionRate = commissionRate;
    await seller.save();

    res.json(seller);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/products
// @desc    List all products, including unapproved ones, for moderation
// @access  Private/Admin
const getAllProductsForAdmin = async (req, res, next) => {
  try {
    const { status } = req.query; // "pending" | "approved" | "all"
    const query = {};
    if (status === "pending") query.isApproved = false;
    if (status === "approved") query.isApproved = true;

    const products = await Product.find(query)
      .populate("seller", "storeName")
      .populate("category", "name")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/admin/products/:id/approval
// @access  Private/Admin
const updateProductApproval = async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    product.isApproved = !!isApproved;
    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllSellers,
  updateSellerVerification,
  updateSellerCommission,
  getAllProductsForAdmin,
  updateProductApproval,
};
