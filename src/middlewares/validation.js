// middlewares/validation.js
const { body, validationResult, query } = require("express-validator");
const AppError = require("../utils/AppError");

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    console.log("Validation errors:", errorMessages); // Debug log

    const error = new AppError("Validation failed", 400);
    error.errors = errorMessages;
    return next(error);
  }
  next();
};

// User Registration Validation
const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  body("phone")
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 characters")
    .matches(/^[\+]?[\d\s\-\(\)]+$/)
    .withMessage("Please provide a valid phone number format"),

  handleValidationErrors,
];

// User Login Validation
const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

// Category Validation
const validateCategory = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("icon")
    .optional()
    .isString()
    .withMessage("Icon must be a string"),

  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),

  body("sort_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),

  // Validate subcategories array if provided
  body("subcategories")
    .optional()
    .custom((value) => {
      try {
        // If subcategories is a string, try to parse it as JSON
        if (typeof value === "string") {
          JSON.parse(value);
        }
        return true;
      } catch (e) {
        throw new Error("Subcategories must be a valid JSON array");
      }
    }),

  handleValidationErrors,
];

// Category Patch Validation (for partial updates)
const validateCategoryPatch = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("icon")
    .optional()
    .isString()
    .withMessage("Icon must be a string"),

  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),

  body("sort_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),

  // Validate subcategories array if provided
  body("subcategories")
    .optional()
    .custom((value) => {
      try {
        // If subcategories is a string, try to parse it as JSON
        if (typeof value === "string") {
          JSON.parse(value);
        }
        return true;
      } catch (e) {
        throw new Error("Subcategories must be a valid JSON array");
      }
    }),

  handleValidationErrors,
];

// SubCategory Validation
const validateSubCategory = [
  body("category_id")
    .isInt({ min: 1 })
    .withMessage("Please provide a valid category ID"),

  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Subcategory name must be between 2 and 50 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("icon")
    .optional()
    .isString()
    .withMessage("Icon must be a string"),

  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),

  body("sort_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),

  handleValidationErrors,
];

// SubCategory Patch Validation (for partial updates)
const validateSubCategoryPatch = [
  body("category_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Please provide a valid category ID"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Subcategory name must be between 2 and 50 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("icon")
    .optional()
    .isString()
    .withMessage("Icon must be a string"),

  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),

  body("sort_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),

  handleValidationErrors,
];

// Product Validation
const validateProduct = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("sale_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Sale price must be a positive number"),

  body("sale_start_date")
    .optional()
    .isISO8601()
    .withMessage("Sale start date must be a valid date (YYYY-MM-DD)"),

  body("sale_end_date")
    .optional()
    .isISO8601()
    .withMessage("Sale end date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.sale_start_date &&
        new Date(value) <= new Date(req.body.sale_start_date)
      ) {
        throw new Error("Sale end date must be after sale start date");
      }
      return true;
    }),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("subcategory_id")
    .isInt({ min: 1 })
    .withMessage("Please provide a valid subcategory ID"),

  handleValidationErrors,
];

// Product Patch Validation (for partial updates)
const validateProductPatch = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("sale_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Sale price must be a positive number"),

  body("sale_start_date")
    .optional()
    .isISO8601()
    .withMessage("Sale start date must be a valid date (YYYY-MM-DD)"),

  body("sale_end_date")
    .optional()
    .isISO8601()
    .withMessage("Sale end date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.sale_start_date &&
        new Date(value) <= new Date(req.body.sale_start_date)
      ) {
        throw new Error("Sale end date must be after sale start date");
      }
      return true;
    }),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("subcategory_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Please provide a valid subcategory ID"),

  handleValidationErrors,
];

// Comment Validation
const validateComment = [
  body("comment")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Comment must be between 10 and 1000 characters"),

  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  handleValidationErrors,
];

// Order Validation
const validateOrder = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),

  body("items.*.product_id")
    .isInt({ min: 1 })
    .withMessage("Please provide valid product IDs"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("order_type")
    .isIn(["dine_in", "takeaway", "delivery"])
    .withMessage("Order type must be dine_in, takeaway, or delivery"),

  handleValidationErrors,
];

// Price Discount Validation
const validatePriceDiscount = [
  body("percentage")
    .isFloat({ min: 0.01, max: 99.99 })
    .withMessage("Discount percentage must be between 0.01 and 99.99"),

  body("duration")
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive integer in days"),

  body("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),

  body("subcategoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Subcategory ID must be a positive integer"),

  (req, res, next) => {
    // Cannot specify both categoryId and subcategoryId
    if (req.body.categoryId && req.body.subcategoryId) {
      return res.status(400).json({
        success: false,
        message: "Cannot specify both categoryId and subcategoryId",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Price Restore Validation
const validatePriceRestore = [
  body("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),

  body("subcategoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Subcategory ID must be a positive integer"),

  (req, res, next) => {
    // Cannot specify both categoryId and subcategoryId
    if (req.body.categoryId && req.body.subcategoryId) {
      return res.status(400).json({
        success: false,
        message: "Cannot specify both categoryId and subcategoryId",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Validation Price Increase
const validatePriceIncrease = [
  body("percentage")
    .isFloat({ min: 0.01, max: 100 })
    .withMessage("Percentage must be between 0.01 and 100"),

  body("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),

  body("subcategoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Subcategory ID must be a positive integer"),

  (req, res, next) => {
    // Cannot specify both categoryId and subcategoryId
    if (req.body.categoryId && req.body.subcategoryId) {
      return res.status(400).json({
        success: false,
        message: "Cannot specify both categoryId and subcategoryId",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Validation Bulk Price
const validateBulkPrices = [
  body("updates")
    .isArray({ min: 1, max: 100 })
    .withMessage("Updates must be an array with 1-100 items"),

  body("updates.*.productId")
    .isInt({ min: 1 })
    .withMessage("Each update must have a valid product ID"),

  body("updates.*.price")
    .isFloat({ min: 0 })
    .withMessage("Each update must have a valid price (minimum 0)"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Validation Analytics Query
const validateAnalyticsQuery = [
  query("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),

  query("subcategoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Subcategory ID must be a positive integer"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Rating Validation
const validateRating = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateCategory,
  validateCategoryPatch,
  validateSubCategory,
  validateSubCategoryPatch,
  validateProduct,
  validateProductPatch,
  validateComment,
  validateOrder,
  validatePriceDiscount,
  validatePriceRestore,
  handleValidationErrors,
  validatePriceIncrease,
  validateBulkPrices,
  validateAnalyticsQuery,
  validateRating,
};