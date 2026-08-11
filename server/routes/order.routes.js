const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.use(protect); // every order route requires login

router.post("/", createOrder);
router.get("/my", getMyOrders);
router.get("/seller/mine", authorize("seller"), getSellerOrders);
router.get("/:id", getOrderById);
router.put("/:id/status", authorize("seller", "admin"), updateOrderStatus);

module.exports = router;
