const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Seller = require("../models/Seller");

// @route   POST /api/orders
// @desc    Place an order - either from the logged-in user's cart, or as a direct
//          "Buy Now" purchase of a single product (bypasses the cart entirely).
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, buyNowItem } = req.body;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      res.status(400);
      throw new Error("Please provide a complete shipping address");
    }

    const validMethods = ["stripe", "paypal", "jazzcash", "easypaisa", "cod"];
    if (!validMethods.includes(paymentMethod)) {
      res.status(400);
      throw new Error("Invalid payment method");
    }

    // Source items either from a single "Buy Now" product, or from the persisted cart.
    // Either way, stock and price are re-verified from the database below - the client
    // never gets to dictate what something costs or whether it's in stock.
    let sourceItems; // [{ product, quantity, variant }]
    let cart = null;

    if (buyNowItem && buyNowItem.productId) {
      const product = await Product.findById(buyNowItem.productId);
      if (!product) {
        res.status(404);
        throw new Error("Product not found");
      }
      const quantity = Number(buyNowItem.quantity) || 1;
      if (quantity < 1) {
        res.status(400);
        throw new Error("Quantity must be at least 1");
      }
      sourceItems = [{ product, quantity, variant: buyNowItem.variant }];
    } else {
      cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        res.status(400);
        throw new Error("Your cart is empty");
      }
      sourceItems = cart.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        variant: item.variant,
      }));
    }

    // Re-check stock and lock in current prices server-side (never trust client-sent prices)
    const orderItems = [];
    let subtotal = 0;

    for (const item of sourceItems) {
      const product = item.product;

      if (!product || !product.isPublished) {
        res.status(400);
        throw new Error(`Product "${item.product?.title || "unknown"}" is no longer available`);
      }

      if (product.stock < item.quantity) {
        res.status(400);
        throw new Error(`Not enough stock for "${product.title}". Only ${product.stock} left`);
      }

      const price = product.discountPrice || product.price;
      subtotal += price * item.quantity;

      orderItems.push({
        product: product._id,
        seller: product.seller,
        title: product.title,
        quantity: item.quantity,
        price,
        variant: item.variant,
      });
    }

    // Simple flat shipping fee for now - Phase 2B can add live shipping rate APIs
    const shippingFee = subtotal > 5000 ? 0 : 200;
    const tax = 0; // GST/VAT logic can be added per-country later
    const total = subtotal + shippingFee + tax;

    // For COD, order is placed immediately as "pending" payment.
    // For online payment methods, this endpoint is only step 1 -
    // actual payment confirmation happens via a separate payment webhook (Phase 2B).
    const order = await Order.create({
      buyer: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      orderStatus: "placed",
      subtotal,
      shippingFee,
      tax,
      total,
    });

    // Deduct stock for each product
    for (const item of sourceItems) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    // Only clear the cart if this order actually came from the cart -
    // a Buy Now purchase should leave whatever's already in the cart untouched.
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/orders/my
// @desc    Buyer's own order history
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/orders/:id
// @access  Private (buyer who owns it, seller who has items in it, or admin)
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("buyer", "name email");
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    const isOwner = order.buyer._id.equals(req.user._id);
    const isAdmin = req.user.role === "admin";

    let isSellerOfItem = false;
    if (req.user.role === "seller") {
      const seller = await Seller.findOne({ user: req.user._id });
      isSellerOfItem = seller && order.items.some((i) => i.seller.equals(seller._id));
    }

    if (!isOwner && !isAdmin && !isSellerOfItem) {
      res.status(403);
      throw new Error("Not authorized to view this order");
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/orders/seller/mine
// @desc    Orders containing this seller's products
// @access  Private/Seller
const getSellerOrders = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      res.status(403);
      throw new Error("No seller store found for this account");
    }

    const orders = await Order.find({ "items.seller": seller._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/orders/:id/status
// @desc    Update order status (seller or admin) - e.g. processing -> shipped -> delivered
// @access  Private/Seller,Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, trackingNumber } = req.body;
    const validStatuses = ["placed", "processing", "shipped", "delivered", "cancelled"];

    if (orderStatus && !validStatuses.includes(orderStatus)) {
      res.status(400);
      throw new Error("Invalid order status");
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (req.user.role === "seller") {
      const seller = await Seller.findOne({ user: req.user._id });
      const ownsItem = seller && order.items.some((i) => i.seller.equals(seller._id));
      if (!ownsItem) {
        res.status(403);
        throw new Error("Not authorized to update this order");
      }
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    // Mark COD orders as paid once delivered
    if (orderStatus === "delivered" && order.paymentMethod === "cod") {
      order.paymentStatus = "paid";
    }

    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, getSellerOrders, updateOrderStatus };
