const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const Product = require("../../../models/entities/Product");
const Category = require("../../../models/entities/Category");
const SubCategory = require("../../../models/entities/SubCategory");
const { sequelize } = require("../../../config/db");

// Get all products with filtering and pagination
const getAllProducts = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, category, subcategory, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;

  const include = [
    {
      model: SubCategory,
      as: "subcategory",
      include: [{ model: Category, as: "category" }],
    },
  ];

  if (category) {
    include[0].include[0].where = { id: category };
  }
  if (subcategory) {
    include[0].where = { id: subcategory };
  }

  const { count, rows: products } = await Product.findAndCountAll({
    where,
    include,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  // --- MODIFICATION START ---
  // Map over the products to add category_id as a top-level property
  const formattedProducts = products.map((product) => {
    const productData = product.toJSON(); // Convert Sequelize instance to plain object
    return {
      ...productData,
      category_id: productData.subcategory
        ? productData.subcategory.category_id
        : null,
    };
  });
  // --- MODIFICATION END ---

  res.json({
    success: true,
    data: {
      products: formattedProducts, // Use the formatted array
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit),
      },
    },
  });
});

// Get single product
const getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByPk(req.params.id, {
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        include: [{ model: Category, as: "category" }],
      },
    ],
  });

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // --- MODIFICATION START ---
  // Add category_id as a top-level property to the single product object
  const productData = product.toJSON();
  const formattedProduct = {
    ...productData,
    category_id: productData.subcategory
      ? productData.subcategory.category_id
      : null,
  };
  // --- MODIFICATION END ---

  res.json({
    success: true,
    data: formattedProduct, // Use the formatted object
  });
});

// Create new product
const createProduct = catchAsync(async (req, res, next) => {
  const {
    category_id,
    subcategory_id,
    name,
    price,
    sale_price, // <-- NEW
    sale_start_date, // <-- NEW
    sale_end_date, // <-- NEW
    description,
    ingredients,
    stock,
  } = req.body;

  // 1. Check if subcategory exists
  const subcategory = await SubCategory.findByPk(subcategory_id);
  if (!subcategory) {
    return next(new AppError("Invalid subcategory ID", 400));
  }

  // 2. VALIDATE: Check if the subcategory belongs to the provided category
  if (subcategory.category_id !== parseInt(category_id)) {
    return next(
      new AppError("Subcategory does not belong to the specified category", 400)
    );
  }

  // Handle image upload
  let image = null;
  if (req.file) {
    image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  }

  const product = await Product.create({
    subcategory_id,
    name,
    price,
    sale_price, // <-- NEW
    sale_start_date, // <-- NEW
    sale_end_date, // <-- NEW
    description,
    image,
    ingredients,
    stock: stock || 0,
    status: "active",
  });

  const newProduct = await Product.findByPk(product.id, {
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        include: [{ model: Category, as: "category" }],
      },
    ],
  });

  // --- MODIFICATION START ---
  // Also format the response for the newly created product
  const productData = newProduct.toJSON();
  const formattedNewProduct = {
    ...productData,
    category_id: productData.subcategory
      ? productData.subcategory.category_id
      : null,
  };
  // --- MODIFICATION END ---

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: formattedNewProduct, // Use the formatted object
  });
});

// Update product
const updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  const {
    category_id,
    subcategory_id,
    name,
    price,
    sale_price, // <-- NEW
    sale_start_date, // <-- NEW
    sale_end_date, // <-- NEW
    description,
    ingredients,
    stock,
    status,
  } = req.body;

  // If subcategory_id is being updated, perform validation
  if (subcategory_id && subcategory_id !== product.subcategory_id) {
    // 1. Check if the new subcategory exists
    const subcategory = await SubCategory.findByPk(subcategory_id);
    if (!subcategory) {
      return next(new AppError("Invalid subcategory ID", 400));
    }

    // 2. VALIDATE: Check if the new subcategory belongs to the provided category
    if (subcategory.category_id !== parseInt(category_id)) {
      return next(
        new AppError(
          "Subcategory does not belong to the specified category",
          400
        )
      );
    }
  }

  // Handle image upload
  let image = product.image;
  if (req.file) {
    image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  }

  await product.update({
    subcategory_id: subcategory_id || product.subcategory_id,
    name: name || product.name,
    price: price || product.price,
    sale_price: sale_price !== undefined ? sale_price : product.sale_price, // <-- NEW
    sale_start_date:
      sale_start_date !== undefined ? sale_start_date : product.sale_start_date, // <-- NEW
    sale_end_date:
      sale_end_date !== undefined ? sale_end_date : product.sale_end_date, // <-- NEW
    description: description || product.description,
    image,
    ingredients: ingredients || product.ingredients,
    stock: stock !== undefined ? stock : product.stock,
    status: status || product.status,
  });

  const updatedProduct = await Product.findByPk(product.id, {
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        include: [{ model: Category, as: "category" }],
      },
    ],
  });

  // --- MODIFICATION START ---
  // Also format the response for the updated product
  const productData = updatedProduct.toJSON();
  const formattedUpdatedProduct = {
    ...productData,
    category_id: productData.subcategory
      ? productData.subcategory.category_id
      : null,
  };
  // --- MODIFICATION END ---

  res.json({
    success: true,
    message: "Product updated successfully",
    data: formattedUpdatedProduct, // Use the formatted object
  });
});

// Delete product
const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  await product.destroy();

  res.json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Toggle product status
const toggleProductStatus = catchAsync(async (req, res, next) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  const newStatus = product.status === "active" ? "inactive" : "active";
  await product.update({ status: newStatus });

  res.json({
    success: true,
    message: `Product ${
      newStatus === "active" ? "activated" : "deactivated"
    } successfully`,
    data: { status: newStatus },
  });
});

// Get product statistics
const getProductStats = catchAsync(async (req, res, next) => {
  const [
    totalProducts,
    activeProducts,
    inactiveProducts,
    outOfStockProducts,
    lowStockProducts,
    featuredProducts,
    stockValueResult,
  ] = await Promise.all([
    Product.count(),
    Product.count({ where: { status: "active" } }),
    Product.count({ where: { status: "inactive" } }),
    Product.count({ where: { status: "out_of_stock" } }),
    Product.count({
      where: sequelize.where(
        sequelize.literal("stock"),
        "<=",
        sequelize.col("min_stock")
      ),
    }),
    Product.count({ where: { is_featured: true } }),
    Product.findOne({
      attributes: [
        [sequelize.fn("SUM", sequelize.literal("price * stock")), "totalValue"],
      ],
      raw: true,
    }),
  ]);

  const totalStockValue = parseFloat(stockValueResult?.totalValue || 0).toFixed(
    2
  );

  res.json({
    success: true,
    data: {
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      lowStockProducts,
      featuredProducts,
      totalStockValue,
    },
  });
});

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getProductStats,
};
