const rateLimit = require("express-rate-limit");

// Prevents brute-force attacks on login and password-reset requests specifically.
// Much stricter than the general API rate limiter in server.js.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // only 10 attempts per IP per window
  message: { message: "Too many attempts, please try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = authLimiter;
