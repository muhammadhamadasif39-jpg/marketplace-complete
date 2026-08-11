const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  const cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Uploads a single image buffer to Cloudinary and returns its public URL
function uploadToCloudinary(buffer) {
  const cloudinary = require("cloudinary").v2;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "marketplace" }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}

// Saves a single image buffer to local disk and returns a URL served by express.static.
// This is the fallback used when Cloudinary isn't configured yet, so image upload
// works out of the box during local development.
function saveLocally(buffer, originalName) {
  const ext = path.extname(originalName) || ".jpg";
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  return `${serverUrl}/uploads/${filename}`;
}

// @route   POST /api/upload
// @desc    Uploads one or more images (multipart/form-data, field name "images").
//          Returns Cloudinary URLs if configured, otherwise local URLs.
// @access  Private (seller/admin)
const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error("No files were uploaded");
    }

    const urls = [];
    for (const file of req.files) {
      const url = isCloudinaryConfigured
        ? await uploadToCloudinary(file.buffer)
        : saveLocally(file.buffer, file.originalname);
      urls.push(url);
    }

    res.status(201).json({ urls, storage: isCloudinaryConfigured ? "cloudinary" : "local" });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImages, UPLOAD_DIR };
