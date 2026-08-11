const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Short-lived access token - sent with every API request
const generateAccessToken = (userId) => {
  // "jti" (JWT ID) is a random nonce - guarantees every token is unique even if
  // two tokens are issued for the same user within the same second (JWT "iat" is
  // only second-precision, so without this, rapid successive tokens could be identical).
  return jwt.sign({ id: userId, type: "access", jti: crypto.randomBytes(8).toString("hex") }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  });
};

// Long-lived refresh token - used only to get a new access token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: "refresh", jti: crypto.randomBytes(8).toString("hex") },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    }
  );
};

// Generates a random raw token (sent to the user via email/link) plus its SHA-256 hash
// (stored in the database). This way, if the database ever leaks, the raw tokens
// (which grant account access) are NOT exposed - only useless hashes are.
const generateRawAndHashedToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashedToken };
};

const hashToken = (rawToken) => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

// Generates a 6-digit numeric OTP (what gets texted to the user) plus its hash
// (what gets stored in the database) - same never-store-the-real-thing principle
// as the email verification/reset tokens above.
const generateOtp = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  return { otp, hashedOtp };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateRawAndHashedToken,
  hashToken,
  generateOtp,
};
