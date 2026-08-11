const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllSellers,
  updateSellerVerification,
  updateSellerCommission,
  getAllProductsForAdmin,
  updateProductApproval,
} = require("../controllers/admin.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.use(protect, authorize("admin")); // every route below requires an admin

router.get("/stats", getDashboardStats);

router.get("/users", getAllUsers);
router.put("/users/:id/status", updateUserStatus);

router.get("/sellers", getAllSellers);
router.put("/sellers/:id/verification", updateSellerVerification);
router.put("/sellers/:id/commission", updateSellerCommission);

router.get("/products", getAllProductsForAdmin);
router.put("/products/:id/approval", updateProductApproval);

module.exports = router;
