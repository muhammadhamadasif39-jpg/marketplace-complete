const Order = require("../models/Order");
const { buildJazzCashPayload, verifyJazzCashResponse } = require("../utils/jazzcash");
const { buildEasypaisaPayload, verifyEasypaisaResponse } = require("../utils/easypaisa");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Only Stripe requires a secret key at require-time; if it's missing we lazily skip
// initializing it so the rest of the app still runs without a Stripe account configured.
const stripe = process.env.STRIPE_SECRET_KEY ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;

// Fetches the order and makes sure it belongs to the requesting user and is still
// waiting on payment - prevents paying for someone else's order or double-paying.
async function getPayableOrder(orderId, userId, expectedMethod) {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  if (!order.buyer.equals(userId)) {
    const err = new Error("Not authorized for this order");
    err.statusCode = 403;
    throw err;
  }
  if (order.paymentMethod !== expectedMethod) {
    const err = new Error(`This order was not placed with ${expectedMethod}`);
    err.statusCode = 400;
    throw err;
  }
  if (order.paymentStatus === "paid") {
    const err = new Error("This order has already been paid");
    err.statusCode = 400;
    throw err;
  }
  return order;
}

// ============================================================
// JazzCash
// ============================================================

// @route   POST /api/payments/jazzcash/initiate
// @access  Private
const initiateJazzCash = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await getPayableOrder(orderId, req.user._id, "jazzcash");

    if (!order.paymentTxnRef) {
      order.paymentTxnRef = "T" + Date.now() + Math.floor(Math.random() * 1000);
      await order.save();
    }

    const returnUrl = `${process.env.SERVER_URL || "http://localhost:5000"}/api/payments/jazzcash/return`;
    const { url, fields } = buildJazzCashPayload(order, returnUrl);

    res.json({ url, fields });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/payments/jazzcash/callback
// @desc    Server-to-server confirmation from JazzCash - this is the ONLY response we trust
//          to actually mark an order as paid (the browser redirect below is not trusted alone,
//          since a user's browser could be tampered with).
// @access  Public (JazzCash calls this directly)
const jazzCashCallback = async (req, res, next) => {
  try {
    const fields = req.body;

    if (!verifyJazzCashResponse(fields)) {
      console.error("JazzCash callback: secure hash verification FAILED - possible tampering");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const order = await Order.findOne({ paymentTxnRef: fields.pp_TxnRefNo });
    if (!order) {
      return res.status(404).json({ message: "Order not found for this transaction" });
    }

    // "000" is JazzCash's success response code
    if (fields.pp_ResponseCode === "000") {
      order.paymentStatus = "paid";
    } else {
      order.paymentStatus = "failed";
    }
    order.gatewayRawResponse = fields;
    await order.save();

    res.json({ message: "Callback processed" });
  } catch (error) {
    next(error);
  }
};

// @route   GET/POST /api/payments/jazzcash/return
// @desc    Browser redirect after the customer finishes on JazzCash's page.
//          Just sends them back to the order page - actual payment status was already
//          set by the callback above, not by this redirect.
// @access  Public
const jazzCashReturn = (req, res) => {
  const txnRef = req.body?.pp_TxnRefNo || req.query?.pp_TxnRefNo;
  res.redirect(`${CLIENT_URL}/account/orders?paymentReturn=${encodeURIComponent(txnRef || "")}`);
};

// ============================================================
// Easypaisa
// ============================================================

// @route   POST /api/payments/easypaisa/initiate
// @access  Private
const initiateEasypaisa = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await getPayableOrder(orderId, req.user._id, "easypaisa");

    if (!order.paymentTxnRef) {
      order.paymentTxnRef = "T" + Date.now() + Math.floor(Math.random() * 1000);
      await order.save();
    }

    const returnUrl = `${process.env.SERVER_URL || "http://localhost:5000"}/api/payments/easypaisa/callback`;
    const { url, fields } = buildEasypaisaPayload(order, returnUrl);

    res.json({ url, fields });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/payments/easypaisa/callback
// @desc    Easypaisa's postBackURL - called both server-to-server and sometimes via
//          browser redirect depending on integration type. We verify the hash either way.
// @access  Public
const easypaisaCallback = async (req, res, next) => {
  try {
    const fields = { ...req.body, ...req.query };

    if (!verifyEasypaisaResponse(fields)) {
      console.error("Easypaisa callback: hash verification FAILED - possible tampering");
      return res.status(400).send("Invalid signature");
    }

    const order = await Order.findOne({ paymentTxnRef: fields.orderRefNum });
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Easypaisa's success indicator varies by integration - commonly "0000" or status "PAID".
    // Verify the exact value against your merchant dashboard's response codes.
    const isSuccess = fields.status === "0000" || fields.responseCode === "0000";
    order.paymentStatus = isSuccess ? "paid" : "failed";
    order.gatewayRawResponse = fields;
    await order.save();

    res.redirect(`${CLIENT_URL}/account/orders?paymentReturn=${encodeURIComponent(fields.orderRefNum || "")}`);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Stripe (bank/debit/credit cards)
// ============================================================

// @route   POST /api/payments/stripe/create-session
// @access  Private
const createStripeSession = async (req, res, next) => {
  try {
    if (!stripe) {
      res.status(503);
      throw new Error("Stripe is not configured yet - add STRIPE_SECRET_KEY to .env");
    }

    const { orderId } = req.body;
    const order = await getPayableOrder(orderId, req.user._id, "stripe");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: order.items.map((item) => ({
        price_data: {
          currency: "pkr",
          product_data: { name: item.title },
          unit_amount: Math.round(item.price * 100), // Stripe expects the smallest currency unit
        },
        quantity: item.quantity,
      })),
      success_url: `${CLIENT_URL}/account/orders?placed=${order._id}`,
      cancel_url: `${CLIENT_URL}/checkout`,
      metadata: { orderId: order._id.toString() },
    });

    order.paymentTxnRef = session.id;
    await order.save();

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/payments/stripe/webhook
// @desc    Stripe calls this when a checkout session completes. Signature is verified
//          using the raw request body (see server.js - this route needs raw body, not JSON-parsed).
// @access  Public (verified via Stripe signature, not auth)
const stripeWebhook = async (req, res, next) => {
  if (!stripe) return res.status(503).send("Stripe not configured");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const order = await Order.findById(session.metadata.orderId);
      if (order) {
        order.paymentStatus = "paid";
        await order.save();
      }
    }
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateJazzCash,
  jazzCashCallback,
  jazzCashReturn,
  initiateEasypaisa,
  easypaisaCallback,
  createStripeSession,
  stripeWebhook,
};
