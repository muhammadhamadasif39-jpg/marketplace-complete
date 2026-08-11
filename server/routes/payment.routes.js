const express = require("express");
const router = express.Router();
const {
  initiateJazzCash,
  jazzCashCallback,
  jazzCashReturn,
  initiateEasypaisa,
  easypaisaCallback,
  createStripeSession,
} = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth.middleware");

// JazzCash
router.post("/jazzcash/initiate", protect, initiateJazzCash);
router.post("/jazzcash/callback", jazzCashCallback); // called by JazzCash's servers, not the browser
router.all("/jazzcash/return", jazzCashReturn); // browser redirect back after payment

// Easypaisa
router.post("/easypaisa/initiate", protect, initiateEasypaisa);
router.all("/easypaisa/callback", easypaisaCallback);

// Stripe
router.post("/stripe/create-session", protect, createStripeSession);
// Note: /stripe/webhook is registered separately in server.js with raw-body parsing,
// which Stripe's signature verification requires - see the comment there.

module.exports = router;
