const express = require("express");
const router = express.Router();
const {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/banner.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.get("/", getActiveBanners); // public
router.get("/all", protect, authorize("admin"), getAllBanners);
router.post("/", protect, authorize("admin"), createBanner);
router.put("/:id", protect, authorize("admin"), updateBanner);
router.delete("/:id", protect, authorize("admin"), deleteBanner);

module.exports = router;
