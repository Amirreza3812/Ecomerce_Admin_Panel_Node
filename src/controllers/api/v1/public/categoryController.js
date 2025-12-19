const {
  Category,
  SubCategory,
  Product,
} = require("../../../../models/associations");
const ApiResponse = require("../../../../utils/apiResponse");
const catchAsync = require("../../../../utils/catchAsync");
const AppError = require("../../../../utils/AppError");
const { getAllSubCategories } = require("../../admin/subcategoryController");

// @desc    Get all active categories
// @route   GET /api/v1/public/categories
// @access  Public
const getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.findAll({
    where: { status: "active" },
    attributes: ["id", "name", "description", "icon", "sort_order"],
    order: [
      ["sort_order", "ASC"],
      ["name", "ASC"],
    ],
    include: [
      {
        model: SubCategory,
        as: "subcategories",
        where: { status: "active" },
        required: false,
        attributes: ["id", "name", "description", "icon", "sort_order"],
        order: [["sort_order", "ASC"]],
        include: [
          {
            model: Product,
            as: "products",
            where: { status: "active" },
            required: false,
            attributes: [
              "id",
              "name",
              "price",
              "image",
              "rating",
              "total_reviews",
              "ingredients",
            ],
            limit: 5,
          },
        ],
      },
    ],
  });

  ApiResponse.success(res, categories, "Categories retrieved successfully");
});

// @desc    Get single category by ID
// @route   GET /api/v1/public/categories/:id
// @access  Public
const getCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findOne({
    where: { id, status: "active" },
    attributes: ["id", "name", "description", "icon"],
    include: [
      {
        model: SubCategory,
        as: "subcategories",
        where: { status: "active" },
        required: false,
        attributes: ["id", "name", "description", "icon", "sort_order"],
        order: [["sort_order", "ASC"]],
        include: [
          {
            model: Product,
            as: "products",
            where: { status: "active" },
            required: false,
            attributes: [
              "id",
              "name",
              "description",
              "price",
              "image",
              "rating",
              "total_reviews",
              "is_featured",
            ],
            order: [
              ["is_featured", "DESC"],
              ["sort_order", "ASC"],
            ],
          },
        ],
      },
    ],
  });

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  ApiResponse.success(res, category, "Category retrieved successfully");
});

// @desc    Get category statistics
// @route   GET /api/v1/public/categories/stats
// @access  Public
const getCategoryStats = catchAsync(async (req, res, next) => {
  const stats = await Category.findAll({
    where: { status: "active" },
    attributes: [
      "id",
      "name",
      [
        Category.sequelize.fn(
          "COUNT",
          Category.sequelize.col("subcategories.products.id")
        ),
        "product_count",
      ],
    ],
    include: [
      {
        model: SubCategory,
        as: "subcategories",
        where: { status: "active" },
        required: false,
        attributes: [],
        include: [
          {
            model: Product,
            as: "products",
            where: { status: "active" },
            required: false,
            attributes: [],
          },
        ],
      },
    ],
    group: ["Category.id"],
    order: [["name", "ASC"]],
  });

  ApiResponse.success(res, stats, "Category statistics retrieved successfully");
});

// @desc    Get all available category icons
// @route   GET /api/v1/public/categories/icons
// @access  Public
const getCategoryIcons = catchAsync(async (req, res, next) => {
  const fs = require("fs");
  const path = require("path");

  const iconsDir = path.join(__dirname, "../../../../../icons/category-icons");

  try {
    // Check if directory exists
    if (!fs.existsSync(iconsDir)) {
      return next(new AppError("Category icons directory not found", 404));
    }

    const files = fs.readdirSync(iconsDir);
    const icons = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".svg", ".gif"].includes(ext);
      })
      .map((file) => ({
        name: file,
        url: `${req.protocol}://${req.get(
          "host"
        )}/icons/category-icons/${file}`,
      }));

    ApiResponse.success(res, icons, "Category icons retrieved successfully");
  } catch (error) {
    return next(new AppError("Error reading category icons", 500));
  }
});

// @desc    Get all available subcategory icons
// @route   GET /api/v1/public/subcategories/icons
// @access  Public
const getSubCategoryIcons = catchAsync(async (req, res, next) => {
  const fs = require("fs");
  const path = require("path");

  const iconsDir = path.join(
    __dirname,
    "../../../../../icons/subcategory-icons"
  );

  try {
    // Check if directory exists
    if (!fs.existsSync(iconsDir)) {
      return next(new AppError("Subcategory icons directory not found", 404));
    }

    const files = fs.readdirSync(iconsDir);
    const icons = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".svg", ".gif"].includes(ext);
      })
      .map((file) => ({
        name: file,
        url: `${req.protocol}://${req.get(
          "host"
        )}/icons/subcategory-icons/${file}`,
      }));

    ApiResponse.success(res, icons, "Subcategory icons retrieved successfully");
  } catch (error) {
    return next(new AppError("Error reading subcategory icons", 500));
  }
});

module.exports = {
  getAllCategories,
  getCategory,
  getCategoryStats,
  getCategoryIcons,
  getSubCategoryIcons,
};
