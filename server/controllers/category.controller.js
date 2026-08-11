const Category = require("../models/Category");

// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).populate("parentCategory", "name slug");
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
  try {
    const { name, image, parentCategory } = req.body;

    if (!name) {
      res.status(400);
      throw new Error("Category name is required");
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const exists = await Category.findOne({ slug });
    if (exists) {
      res.status(400);
      throw new Error("This category already exists");
    }

    const category = await Category.create({
      name,
      slug,
      image: image || "",
      parentCategory: parentCategory || null,
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    const { name, image, isActive, parentCategory } = req.body;
    if (name) category.name = name;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;
    if (parentCategory !== undefined) category.parentCategory = parentCategory;

    const updated = await category.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    await category.deleteOne();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
