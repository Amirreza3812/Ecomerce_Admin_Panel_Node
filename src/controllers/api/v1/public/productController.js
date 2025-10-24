const {
  Product,
  SubCategory,
  Category,
  Comment,
  User,
} = require("../../../../models/associations");
const ApiResponse = require("../../../../utils/apiResponse");
const catchAsync = require("../../../../utils/catchAsync");
const AppError = require("../../../../utils/AppError");
const { Op } = require("sequelize");
const { sequelize } = require("../../../../config/db");

// @desc    Get all products with filtering and pagination
// @route   GET /api/v1/public/products
// @access  Public
const getAllProducts = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const offset = (page - 1) * limit;

  // Build filter conditions
  const whereConditions = { status: "active" };

  // Filter by price range
  if (req.query.minPrice || req.query.maxPrice) {
    whereConditions.price = {};
    if (req.query.minPrice) whereConditions.price[Op.gte] = req.query.minPrice;
    if (req.query.maxPrice) whereConditions.price[Op.lte] = req.query.maxPrice;
  }

  // Filter by rating
  if (req.query.minRating) {
    whereConditions.rating = { [Op.gte]: req.query.minRating };
  }

  // Search by name or description
  if (req.query.search) {
    whereConditions[Op.or] = [
      { name: { [Op.like]: `%${req.query.search}%` } },
      { description: { [Op.like]: `%${req.query.search}%` } },
    ];
  }

  // Featured products only
  if (req.query.featured === "true") {
    whereConditions.is_featured = true;
  }

  // Filter by sale status
  if (req.query.on_sale === "true") {
    const today = new Date().toISOString().split("T")[0];
    whereConditions.sale_price = { [Op.not]: null };
    whereConditions.sale_start_date = { [Op.lte]: today };
    whereConditions.sale_end_date = { [Op.gte]: today };
  }

  // Sorting
  // FIX: Use a valid column from the Product model for default sorting
  let orderBy = [["name", "ASC"]];
  if (req.query.sortBy) {
    switch (req.query.sortBy) {
      case "price_low":
        orderBy = [["price", "ASC"]];
        break;
      case "price_high":
        orderBy = [["price", "DESC"]];
        break;
      case "rating":
        orderBy = [["rating", "DESC"]];
        break;
      case "newest":
        orderBy = [["createdAt", "DESC"]];
        break;
      case "popular":
        orderBy = [["total_reviews", "DESC"]];
        break;
      case "discount":
        // Custom sort for discount percentage (highest first)
        orderBy = [
          [
            sequelize.literal(
              "(CASE WHEN sale_price IS NOT NULL AND sale_start_date <= CURRENT_DATE AND sale_end_date >= CURRENT_DATE THEN ((price - sale_price) / price) * 100 ELSE 0 END)"
            ),
            "DESC",
          ],
        ];
        break;
    }
  }

  const { count, rows: products } = await Product.findAndCountAll({
    where: whereConditions,
    attributes: [
      "id",
      "name",
      "description",
      "price",
      "sale_price",
      "sale_start_date",
      "sale_end_date",
      "image",
      "rating",
      "total_reviews",
      "is_featured",
      "preparation_time",
      "calories",
      "allergens",
      "subcategory_id",
    ],
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        attributes: ["id", "name"],
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    order: orderBy,
    limit,
    offset,
  });

  // --- MODIFICATION START ---
  // Map over the products to add category_id and sale information
  const formattedProducts = products.map((product) => {
    const productData = product.toJSON();

    return {
      ...productData,
      category_id: productData.subcategory
        ? productData.subcategory.category_id
        : null,
      effective_price: product.currentPrice, // Use virtual getter
      is_on_sale: product.isOnSale, // Use virtual getter
      discount_percentage: product.discountPercentage, // Use virtual getter
    };
  });
  // --- MODIFICATION END ---

  const pagination = {
    page,
    limit,
    total: count,
  };

  ApiResponse.paginated(
    res,
    formattedProducts,
    pagination,
    "Products retrieved successfully"
  );
});

// @desc    Get single product by ID
// @route   GET /api/v1/public/products/:id
// @access  Public
const getProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return next(new AppError("Invalid product ID. Must be a number.", 400));
  }

  const product = await Product.findOne({
    where: { id: id, status: "active" },
    attributes: [
      "id",
      "name",
      "description",
      "price",
      "sale_price",
      "sale_start_date",
      "sale_end_date",
      "image",
      "gallery",
      "rating",
      "total_reviews",
      "is_featured",
      "preparation_time",
      "ingredients",
      "calories",
      "allergens",
      "sizes",
      "subcategory_id",
    ],
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        attributes: ["id", "name", "description"],
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "description"],
          },
        ],
      },
      {
        model: Comment,
        as: "comments",
        where: { status: "approved" },
        required: false,
        attributes: ["id", "comment", "rating", "createdAt"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "avatar"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 10,
      },
    ],
  });

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // --- MODIFICATION START ---
  // Add category_id and sale information to the single product object
  const productData = product.toJSON();

  const formattedProduct = {
    ...productData,
    category_id: productData.subcategory
      ? productData.subcategory.category_id
      : null,
    effective_price: product.currentPrice, // Use virtual getter
    is_on_sale: product.isOnSale, // Use virtual getter
    discount_percentage: product.discountPercentage, // Use virtual getter
  };
  // --- MODIFICATION END ---

  ApiResponse.success(res, formattedProduct, "Product retrieved successfully");
});

// @desc    Get featured products
// @route   GET /api/v1/public/products/featured
// @access  Public
const getFeaturedProducts = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 8;

  const products = await Product.findAll({
    where: {
      status: "active",
      is_featured: true,
    },
    attributes: [
      "id",
      "name",
      "description",
      "price",
      "sale_price",
      "sale_start_date",
      "sale_end_date",
      "image",
      "rating",
      "total_reviews",
      "subcategory_id",
    ],
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        attributes: ["id", "name"],
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    // FIX: Use a valid column for sorting
    order: [
      ["rating", "DESC"],
      ["total_reviews", "DESC"],
    ],
    limit,
  });

  // --- MODIFICATION START ---
  // Also format the response for featured products with sale information
  const formattedProducts = products.map((product) => {
    const productData = product.toJSON();

    return {
      ...productData,
      category_id: productData.subcategory
        ? productData.subcategory.category_id
        : null,
      effective_price: product.currentPrice, // Use virtual getter
      is_on_sale: product.isOnSale, // Use virtual getter
      discount_percentage: product.discountPercentage, // Use virtual getter
    };
  });
  // --- MODIFICATION END ---

  ApiResponse.success(
    res,
    formattedProducts,
    "Featured products retrieved successfully"
  );
});

// @desc    Get related products
// @route   GET /api/v1/public/products/:id/related
// @access  Public
const getRelatedProducts = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit, 10) || 6;

  const product = await Product.findByPk(id, {
    attributes: ["subcategory_id"],
  });

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  const relatedProducts = await Product.findAll({
    where: {
      status: "active",
      subcategory_id: product.subcategory_id,
      id: { [Op.ne]: id },
    },
    attributes: [
      "id",
      "name",
      "price",
      "sale_price",
      "sale_start_date",
      "sale_end_date",
      "image",
      "rating",
      "total_reviews",
      "subcategory_id",
    ],
    order: [
      ["rating", "DESC"],
      ["total_reviews", "DESC"],
    ],
    limit,
  });

  // --- MODIFICATION START ---
  // Also format the response for related products with sale information
  const formattedProducts = relatedProducts.map((product) => {
    const productData = product.toJSON();

    return {
      ...productData,
      category_id: productData.subcategory
        ? productData.subcategory.category_id
        : null,
      effective_price: product.currentPrice, // Use virtual getter
      is_on_sale: product.isOnSale, // Use virtual getter
      discount_percentage: product.discountPercentage, // Use virtual getter
    };
  });
  // --- MODIFICATION END ---

  ApiResponse.success(
    res,
    formattedProducts,
    "Related products retrieved successfully"
  );
});

// @desc    Get products on sale
// @route   GET /api/v1/public/products/sale
// @access  Public
const getSaleProducts = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const offset = (page - 1) * limit;

  const today = new Date().toISOString().split("T")[0];

  const { count, rows: products } = await Product.findAndCountAll({
    where: {
      status: "active",
      sale_price: { [Op.not]: null },
      sale_start_date: { [Op.lte]: today },
      sale_end_date: { [Op.gte]: today },
    },
    attributes: [
      "id",
      "name",
      "description",
      "price",
      "sale_price",
      "sale_start_date",
      "sale_end_date",
      "image",
      "rating",
      "total_reviews",
      "subcategory_id",
    ],
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        attributes: ["id", "name"],
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    order: [
      [sequelize.literal("((price - sale_price) / price) * 100"), "DESC"],
      ["rating", "DESC"],
    ],
    limit,
    offset,
  });

  // Format products with sale information
  const formattedProducts = products.map((product) => {
    const productData = product.toJSON();

    return {
      ...productData,
      category_id: productData.subcategory
        ? productData.subcategory.category_id
        : null,
      effective_price: product.currentPrice, // Use virtual getter
      is_on_sale: product.isOnSale, // Use virtual getter
      discount_percentage: product.discountPercentage, // Use virtual getter
    };
  });

  const pagination = {
    page,
    limit,
    total: count,
  };

  ApiResponse.paginated(
    res,
    formattedProducts,
    pagination,
    "Sale products retrieved successfully"
  );
});

// @desc    Rate a product
// @route   POST /api/v1/public/products/:id/rate
// @access  Private (requires authentication)
const rateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { rating } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!rating || rating < 1 || rating > 5) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  // Check if product exists
  const product = await Product.findByPk(id);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // Check if user has already rated this product
  const existingRating = await Comment.findOne({
    where: {
      product_id: id,
      user_id: userId,
      rating: { [Op.not]: null },
    },
  });

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    let comment;

    if (existingRating) {
      // Update existing rating
      await existingRating.update({ rating }, { transaction });
      comment = existingRating;
    } else {
      // Create new rating (without comment text)
      comment = await Comment.create(
        {
          product_id: id,
          user_id: userId,
          rating,
          status: "approved", // Auto-approve ratings without comments
        },
        { transaction }
      );
    }

    // Recalculate product rating
    const ratingStats = await Comment.findOne({
      where: {
        product_id: id,
        rating: { [Op.not]: null },
        status: "approved",
      },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating")), "avgRating"],
        [sequelize.fn("COUNT", sequelize.col("id")), "totalReviews"],
      ],
      raw: true,
      transaction,
    });

    // Update product with new rating
    await Product.update(
      {
        rating: parseFloat(ratingStats.avgRating).toFixed(2),
        total_reviews: parseInt(ratingStats.totalReviews),
      },
      {
        where: { id },
        transaction,
      }
    );

    // Commit the transaction
    await transaction.commit();

    // Get updated product
    const updatedProduct = await Product.findByPk(id);

    ApiResponse.success(
      res,
      {
        rating: parseFloat(rating),
        productRating: {
          rating: updatedProduct.rating,
          total_reviews: updatedProduct.total_reviews,
        },
      },
      "Product rated successfully"
    );
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    return next(new AppError("Failed to rate product", 500));
  }
});

// @desc    Get product ratings
// @route   GET /api/v1/public/products/:id/ratings
// @access  Public
const getProductRatings = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  // Check if product exists
  const product = await Product.findByPk(id);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // Get ratings with pagination
  const { count, rows: ratings } = await Comment.findAndCountAll({
    where: {
      product_id: id,
      rating: { [Op.not]: null },
      status: "approved",
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "avatar"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  // Get rating distribution using virtual getter
  const distribution = await product.getRatingDistribution();

  const pagination = {
    page,
    limit,
    total: count,
    pages: Math.ceil(count / limit),
  };

  ApiResponse.success(
    res,
    {
      productRating: {
        rating: product.rating,
        total_reviews: product.total_reviews,
      },
      distribution,
      ratings,
      pagination,
    },
    "Product ratings retrieved successfully"
  );
});

// @desc    Get top rated products
// @route   GET /api/v1/public/products/top-rated
// @access  Public
const getTopRatedProducts = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const minReviews = parseInt(req.query.minReviews, 10) || 3;

  const products = await Product.findAll({
    where: {
      status: "active",
      total_reviews: { [Op.gte]: minReviews },
    },
    attributes: [
      "id",
      "name",
      "description",
      "price",
      "sale_price",
      "sale_start_date",
      "sale_end_date",
      "image",
      "rating",
      "total_reviews",
      "subcategory_id",
    ],
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        attributes: ["id", "name"],
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    order: [
      ["rating", "DESC"],
      ["total_reviews", "DESC"],
    ],
    limit,
  });

  // Format products with sale information
  const formattedProducts = products.map((product) => {
    const productData = product.toJSON();

    return {
      ...productData,
      category_id: productData.subcategory
        ? productData.subcategory.category_id
        : null,
      effective_price: product.currentPrice,
      is_on_sale: product.isOnSale,
      discount_percentage: product.discountPercentage,
    };
  });

  ApiResponse.success(
    res,
    formattedProducts,
    "Top rated products retrieved successfully"
  );
});

module.exports = {
  getAllProducts,
  getProduct,
  getFeaturedProducts,
  getRelatedProducts,
  getSaleProducts, // Add this new function
  rateProduct,
  getProductRatings,
  getTopRatedProducts,
};
