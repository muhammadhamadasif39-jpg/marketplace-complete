const express = require("express");
const multer = require("multer");
const router = express.Router();
const { uploadImages } = require("../controllers/upload.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// Store in memory (not disk) - we decide where the final file goes (Cloudinary or local disk)
// inside the controller, so we don't want multer writing a temp file first.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 }, // 5MB per file, max 6 files per request
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP, and GIF images are allowed"));
    }
    cb(null, true);
  },
});

router.post("/", protect, authorize("seller", "admin"), upload.array("images", 6), uploadImages);

module.exports = router;
