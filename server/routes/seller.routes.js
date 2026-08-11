const express = require("express");
const router = express.Router();
const { registerStore, getMyStore, getStoreBySlug, updateMyStore } = require("../controllers/seller.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", protect, registerStore);
router.get("/me", protect, getMyStore);
router.put("/me", protect, updateMyStore);
router.get("/:slug", getStoreBySlug);

module.exports = router;
