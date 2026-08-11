const Product = require("../models/Product");
const Seller = require("../models/Seller");

// @route   GET /api/products
// @desc    Get all products with search, filter, pagination
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { search, category, brand, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;

    const query = { isPublished: true, isApproved: true };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }
    if (brand) {
      query.brand = brand;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 }; // newest first by default
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "rating") sortOption = { "rating.average": -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("seller", "storeName storeSlug rating")
        .populate("category", "name slug")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalResults: total,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate("seller", "storeName storeSlug rating storeLogo")
      .populate("category", "name slug")
      .populate("reviews.user", "name profilePicture");

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    if (!product.isPublished || !product.isApproved) {
      res.status(404);
      throw new Error("Product not found");
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/products
// @desc    Create a new product (seller only)
// @access  Private/Seller
const createProduct = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      res.status(403);
      throw new Error("You must have a seller account to add products");
    }

    const { title, description, category, price, images, stock, variants, brand, productType } = req.body;

    if (!title || !description || !category || !price) {
      res.status(400);
      throw new Error("Please provide title, description, category and price");
    }

    // Generate a URL-friendly slug from the title, with random suffix to avoid collisions
    const slug =
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString(36);

    const product = await Product.create({
      seller: seller._id,
      title,
      slug,
      description,
      category,
      brand,
      price,
      images: images || [],
      stock: stock || 0,
      variants: variants || [],
      productType: productType || "physical",
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/products/:id
// @access  Private/Seller (own products only)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const seller = await Seller.findOne({ user: req.user._id });
    // Ensure the logged-in seller owns this product (or is an admin)
    if (req.user.role !== "admin" && (!seller || !product.seller.equals(seller._id))) {
      res.status(403);
      throw new Error("Not authorized to edit this product");
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "brand",
      "price",
      "discountPrice",
      "images",
      "stock",
      "variants",
      "isPublished",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/products/:id
// @access  Private/Seller (own products only)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const seller = await Seller.findOne({ user: req.user._id });
    if (req.user.role !== "admin" && (!seller || !product.seller.equals(seller._id))) {
      res.status(403);
      throw new Error("Not authorized to delete this product");
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/products/seller/mine
// @desc    Get all products belonging to the logged-in seller (including unpublished)
// @access  Private/Seller
const getMyProducts = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      res.status(403);
      throw new Error("No seller store found for this account");
    }

    const products = await Product.find({ seller: seller._id })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/products/id/:id
// @desc    Get a product by its Mongo ID (used by seller edit forms)
// @access  Private/Seller (own product) or Admin
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name");
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const seller = await Seller.findOne({ user: req.user._id });
    if (req.user.role !== "admin" && (!seller || !product.seller.equals(seller._id))) {
      res.status(403);
      throw new Error("Not authorized to view this product");
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/products/brands
// @desc    Distinct brand names among published, approved products - for filter dropdowns
// @access  Public
const getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct("brand", {
      isPublished: true,
      isApproved: true,
      brand: { $nin: [null, ""] },
    });
    res.json(brands.sort());
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getProductById,
  getBrands,
};
