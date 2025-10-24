const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const ApiResponse = require("../../../utils/apiResponse");
const {
  Product,
  Category,
  SubCategory,
} = require("../../../models/associations");
const { Op } = require("sequelize");

// @desc    Apply percentage increase to all products
// @route   PATCH /api/v1/admin/prices/increase
// @access  Admin
const increaseAllPrices = catchAsync(async (req, res, next) => {
  const { percentage, categoryId, subcategoryId } = req.body;

  if (!percentage || percentage <= 0) {
    return next(
      new AppError("Please provide a valid positive percentage", 400)
    );
  }

  if (percentage > 100) {
    return next(new AppError("Percentage increase cannot exceed 100%", 400));
  }

  let whereClause = {};
  let categoryFilter = "";
  let subcategoryFilter = "";

  // Build where clause based on filters
  if (subcategoryId) {
    whereClause.subcategory_id = subcategoryId;
    const subcategory = await SubCategory.findByPk(subcategoryId, {
      include: [{ model: Category, as: "category" }],
    });
    if (subcategory) {
      subcategoryFilter = ` in subcategory "${subcategory.name}"`;
      categoryFilter = ` (${subcategory.category.name})`;
    }
  } else if (categoryId) {
    // Get all subcategories for this category
    const subcategories = await SubCategory.findAll({
      where: { category_id: categoryId },
      include: [{ model: Category, as: "category" }],
    });

    if (subcategories.length > 0) {
      whereClause.subcategory_id = {
        [Op.in]: subcategories.map((sub) => sub.id),
      };
      categoryFilter = ` in category "${subcategories[0].category.name}"`;
    }
  }

  // Get products before update for audit
  const productsToUpdate = await Product.findAll({
    where: whereClause,
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        include: [{ model: Category, as: "category" }],
      },
    ],
  });

  if (productsToUpdate.length === 0) {
    return next(new AppError("No products found matching the criteria", 404));
  }

  // Calculate new prices and update
  const multiplier = 1 + percentage / 100;
  const updatePromises = productsToUpdate.map((product) => {
    const newPrice = Math.round(product.price * multiplier * 100) / 100; // Round to 2 decimal places
    return Product.update({ price: newPrice }, { where: { id: product.id } });
  });

  await Promise.all(updatePromises);

  // Log the price update for audit
  console.log(
    `[PRICE UPDATE] Admin ${req.user.id} increased prices by ${percentage}%${categoryFilter}${subcategoryFilter}`,
    {
      timestamp: new Date().toISOString(),
      adminId: req.user.id,
      adminEmail: req.user.email,
      percentage,
      productsAffected: productsToUpdate.length,
      categoryId: categoryId || null,
      subcategoryId: subcategoryId || null,
      productIds: productsToUpdate.map((p) => p.id),
    }
  );

  ApiResponse.success(
    res,
    {
      productsUpdated: productsToUpdate.length,
      percentage,
      multiplier,
      filters: {
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
      },
      summary: `Increased prices by ${percentage}% for ${productsToUpdate.length} products${categoryFilter}${subcategoryFilter}`,
    },
    `Successfully increased prices by ${percentage}% for ${productsToUpdate.length} products`
  );
});

// @desc    Apply percentage decrease/discount to all products
// @route   PATCH /api/v1/admin/prices/discount
// @access  Admin
const applyDiscountToAll = catchAsync(async (req, res, next) => {
  const { 
    percentage, 
    categoryId, 
    subcategoryId, 
    duration 
  } = req.body;

  if (!percentage || percentage <= 0) {
    return next(
      new AppError("Please provide a valid positive percentage", 400)
    );
  }

  if (percentage >= 100) {
    return next(
      new AppError("Discount percentage must be less than 100%", 400)
    );
  }

  if (!duration || duration <= 0) {
    return next(
      new AppError("Please provide a valid positive duration in days", 400)
    );
  }

  let whereClause = {};
  let categoryFilter = "";
  let subcategoryFilter = "";

  // Build where clause based on filters
  if (subcategoryId) {
    whereClause.subcategory_id = subcategoryId;
    const subcategory = await SubCategory.findByPk(subcategoryId, {
      include: [{ model: Category, as: "category" }],
    });
    if (subcategory) {
      subcategoryFilter = ` in subcategory "${subcategory.name}"`;
      categoryFilter = ` (${subcategory.category.name})`;
    }
  } else if (categoryId) {
    // Get all subcategories for this category
    const subcategories = await SubCategory.findAll({
      where: { category_id: categoryId },
      include: [{ model: Category, as: "category" }],
    });

    if (subcategories.length > 0) {
      whereClause.subcategory_id = {
        [Op.in]: subcategories.map((sub) => sub.id),
      };
      categoryFilter = ` in category "${subcategories[0].category.name}"`;
    }
  }

  // Get products before update for audit
  const productsToUpdate = await Product.findAll({
    where: whereClause,
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        include: [{ model: Category, as: "category" }],
      },
    ],
  });

  if (productsToUpdate.length === 0) {
    return next(new AppError("No products found matching the criteria", 404));
  }

  // Calculate sale dates based on duration
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + duration);
  
  const saleStartDate = today.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  const saleEndDate = endDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD

  // Calculate new prices and update
  const multiplier = 1 - percentage / 100;
  const updatePromises = productsToUpdate.map((product) => {
    // Calculate sale price based on percentage
    const newSalePrice = Math.round(product.price * multiplier * 100) / 100;
    
    // Store the original price if not already stored
    const originalPrice = product.original_price || product.price;

    return Product.update(
      {
        price: newSalePrice, // Update the current price to the sale price
        original_price: originalPrice,
        sale_price: newSalePrice,
        sale_start_date: saleStartDate,
        sale_end_date: saleEndDate,
      },
      { where: { id: product.id } }
    );
  });

  await Promise.all(updatePromises);

  // Log the price update for audit
  console.log(
    `[PRICE DISCOUNT] Admin ${req.user.id} applied ${percentage}% discount for ${duration} days${categoryFilter}${subcategoryFilter}`,
    {
      timestamp: new Date().toISOString(),
      adminId: req.user.id,
      adminEmail: req.user.email,
      percentage,
      duration,
      productsAffected: productsToUpdate.length,
      categoryId: categoryId || null,
      subcategoryId: subcategoryId || null,
      productIds: productsToUpdate.map((p) => p.id),
      salePeriod: {
        startDate: saleStartDate,
        endDate: saleEndDate,
        durationDays: duration
      }
    }
  );

  ApiResponse.success(
    res,
    {
      productsUpdated: productsToUpdate.length,
      percentage,
      multiplier,
      duration,
      filters: {
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
      },
      salePeriod: {
        startDate: saleStartDate,
        endDate: saleEndDate,
        durationDays: duration,
      },
      summary: `Applied ${percentage}% discount for ${duration} days to ${productsToUpdate.length} products${categoryFilter}${subcategoryFilter}`,
    },
    `Successfully applied ${percentage}% discount for ${duration} days to ${productsToUpdate.length} products`
  );
});

// @desc    Set specific price for multiple products
// @route   PATCH /api/v1/admin/prices/set-bulk
// @access  Admin
const setBulkPrices = catchAsync(async (req, res, next) => {
  const { updates } = req.body; // Array of { productId, price }

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return next(new AppError("Please provide an array of price updates", 400));
  }

  if (updates.length > 100) {
    return next(
      new AppError("Cannot update more than 100 products at once", 400)
    );
  }

  // Validate each update
  for (const update of updates) {
    if (
      !update.productId ||
      typeof update.price !== "number" ||
      update.price < 0
    ) {
      return next(
        new AppError("Each update must have productId and valid price", 400)
      );
    }
  }

  // Check if all products exist
  const productIds = updates.map((u) => u.productId);
  const existingProducts = await Product.findAll({
    where: { id: { [Op.in]: productIds } },
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        include: [{ model: Category, as: "category" }],
      },
    ],
  });

  if (existingProducts.length !== productIds.length) {
    return next(new AppError("Some products not found", 404));
  }

  // Perform bulk update
  const updatePromises = updates.map(({ productId, price }) => {
    const roundedPrice = Math.round(price * 100) / 100; // Round to 2 decimal places
    return Product.update(
      { price: roundedPrice },
      { where: { id: productId } }
    );
  });

  await Promise.all(updatePromises);

  // Log the bulk price update for audit
  console.log(
    `[BULK PRICE UPDATE] Admin ${req.user.id} updated prices for ${updates.length} products`,
    {
      timestamp: new Date().toISOString(),
      adminId: req.user.id,
      adminEmail: req.user.email,
      updatesCount: updates.length,
      productIds: productIds,
      updates: updates,
    }
  );

  ApiResponse.success(
    res,
    {
      productsUpdated: updates.length,
      updates: updates.map((u) => ({
        productId: u.productId,
        newPrice: Math.round(u.price * 100) / 100,
      })),
    },
    `Successfully updated prices for ${updates.length} products`
  );
});

// @desc    Get price update history/analytics
// @route   GET /api/v1/admin/prices/analytics
// @access  Admin
const getPriceAnalytics = catchAsync(async (req, res, next) => {
  const { categoryId, subcategoryId } = req.query;

  let whereClause = {};

  // Build where clause based on filters
  if (subcategoryId) {
    whereClause.subcategory_id = subcategoryId;
  } else if (categoryId) {
    // Get all subcategories for this category
    const subcategories = await SubCategory.findAll({
      where: { category_id: categoryId },
    });

    if (subcategories.length > 0) {
      whereClause.subcategory_id = {
        [Op.in]: subcategories.map((sub) => sub.id),
      };
    }
  }

  // Get price statistics
  const products = await Product.findAll({
    where: whereClause,
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        include: [{ model: Category, as: "category" }],
      },
    ],
    order: [["price", "ASC"]],
  });

  if (products.length === 0) {
    return next(new AppError("No products found matching the criteria", 404));
  }

  const prices = products.map((p) => p.price);
  const totalProducts = products.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice =
    Math.round(
      (prices.reduce((sum, price) => sum + price, 0) / totalProducts) * 100
    ) / 100;

  // Calculate price ranges
  const priceRanges = {
    under_5: products.filter((p) => p.price < 5).length,
    "5_to_10": products.filter((p) => p.price >= 5 && p.price < 10).length,
    "10_to_20": products.filter((p) => p.price >= 10 && p.price < 20).length,
    "20_to_50": products.filter((p) => p.price >= 20 && p.price < 50).length,
    over_50: products.filter((p) => p.price >= 50).length,
  };

  // Group by category/subcategory
  const categoryStats = {};
  products.forEach((product) => {
    const categoryName = product.subcategory.category.name;
    const subcategoryName = product.subcategory.name;

    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = {
        productCount: 0,
        avgPrice: 0,
        minPrice: Infinity,
        maxPrice: 0,
        subcategories: {},
      };
    }

    const catStat = categoryStats[categoryName];
    catStat.productCount++;
    catStat.minPrice = Math.min(catStat.minPrice, product.price);
    catStat.maxPrice = Math.max(catStat.maxPrice, product.price);

    if (!catStat.subcategories[subcategoryName]) {
      catStat.subcategories[subcategoryName] = {
        productCount: 0,
        avgPrice: 0,
        prices: [],
      };
    }

    catStat.subcategories[subcategoryName].productCount++;
    catStat.subcategories[subcategoryName].prices.push(product.price);
  });

  // Calculate averages for categories
  Object.keys(categoryStats).forEach((categoryName) => {
    const catStat = categoryStats[categoryName];
    const allCategoryPrices = [];

    Object.keys(catStat.subcategories).forEach((subcategoryName) => {
      const subStat = catStat.subcategories[subcategoryName];
      const subcategoryPrices = subStat.prices;
      allCategoryPrices.push(...subcategoryPrices);

      subStat.avgPrice =
        Math.round(
          (subcategoryPrices.reduce((sum, price) => sum + price, 0) /
            subcategoryPrices.length) *
            100
        ) / 100;
      delete subStat.prices; // Remove prices array from response
    });

    catStat.avgPrice =
      Math.round(
        (allCategoryPrices.reduce((sum, price) => sum + price, 0) /
          allCategoryPrices.length) *
          100
      ) / 100;
  });

  ApiResponse.success(
    res,
    {
      overview: {
        totalProducts,
        minPrice,
        maxPrice,
        avgPrice,
      },
      priceRanges,
      categoryStats,
      filters: {
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
      },
    },
    "Price analytics retrieved successfully"
  );
});

// Add this new function to restore original prices
// @desc    Restore original prices for products
// @route   PATCH /api/v1/admin/prices/restore
// @access  Admin
const restoreOriginalPrices = catchAsync(async (req, res, next) => {
  const { categoryId, subcategoryId } = req.body;

  let whereClause = {
    original_price: { [Op.not]: null }, // Only restore products that have an original price stored
  };

  let categoryFilter = "";
  let subcategoryFilter = "";

  // Build where clause based on filters
  if (subcategoryId) {
    whereClause.subcategory_id = subcategoryId;
    const subcategory = await SubCategory.findByPk(subcategoryId, {
      include: [{ model: Category, as: "category" }],
    });
    if (subcategory) {
      subcategoryFilter = ` in subcategory "${subcategory.name}"`;
      categoryFilter = ` (${subcategory.category.name})`;
    }
  } else if (categoryId) {
    // Get all subcategories for this category
    const subcategories = await SubCategory.findAll({
      where: { category_id: categoryId },
      include: [{ model: Category, as: "category" }],
    });

    if (subcategories.length > 0) {
      whereClause.subcategory_id = {
        [Op.in]: subcategories.map((sub) => sub.id),
      };
      categoryFilter = ` in category "${subcategories[0].category.name}"`;
    }
  }

  // Get products before update for audit
  const productsToUpdate = await Product.findAll({
    where: whereClause,
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        include: [{ model: Category, as: "category" }],
      },
    ],
  });

  if (productsToUpdate.length === 0) {
    return next(
      new AppError("No products found with original prices to restore", 404)
    );
  }

  // Restore original prices
  const updatePromises = productsToUpdate.map((product) => {
    return Product.update(
      {
        price: product.original_price,
        original_price: null, // Clear the original price
        sale_price: null,
        sale_start_date: null,
        sale_end_date: null,
      },
      { where: { id: product.id } }
    );
  });

  await Promise.all(updatePromises);

  // Log the price restoration for audit
  console.log(
    `[PRICE RESTORE] Admin ${req.user.id} restored original prices${categoryFilter}${subcategoryFilter}`,
    {
      timestamp: new Date().toISOString(),
      adminId: req.user.id,
      adminEmail: req.user.email,
      productsAffected: productsToUpdate.length,
      categoryId: categoryId || null,
      subcategoryId: subcategoryId || null,
      productIds: productsToUpdate.map((p) => p.id),
    }
  );

  ApiResponse.success(
    res,
    {
      productsUpdated: productsToUpdate.length,
      filters: {
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
      },
      summary: `Restored original prices for ${productsToUpdate.length} products${categoryFilter}${subcategoryFilter}`,
    },
    `Successfully restored original prices for ${productsToUpdate.length} products`
  );
});

// Add this new function to check for expired sales
// @desc    Restore prices for products with expired sales
// @route   PATCH /api/v1/admin/prices/restore-expired
// @access  Admin
const restoreExpiredSales = catchAsync(async (req, res, next) => {
  const today = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD

  // Find products with expired sales
  const productsToUpdate = await Product.findAll({
    where: {
      sale_end_date: {
        [Op.lt]: today,
      },
      original_price: { [Op.not]: null },
    },
    include: [
      {
        model: SubCategory,
        as: "subcategory",
        include: [{ model: Category, as: "category" }],
      },
    ],
  });

  if (productsToUpdate.length === 0) {
    return next(new AppError("No products with expired sales found", 404));
  }

  // Restore original prices
  const updatePromises = productsToUpdate.map((product) => {
    return Product.update(
      {
        price: product.original_price,
        original_price: null, // Clear the original price
        sale_price: null,
        sale_start_date: null,
        sale_end_date: null,
      },
      { where: { id: product.id } }
    );
  });

  await Promise.all(updatePromises);

  // Log the price restoration for audit
  console.log(
    `[PRICE RESTORE EXPIRED] Admin ${req.user.id} restored prices for ${productsToUpdate.length} products with expired sales`,
    {
      timestamp: new Date().toISOString(),
      adminId: req.user.id,
      adminEmail: req.user.email,
      productsAffected: productsToUpdate.length,
      productIds: productsToUpdate.map((p) => p.id),
    }
  );

  ApiResponse.success(
    res,
    {
      productsUpdated: productsToUpdate.length,
      summary: `Restored original prices for ${productsToUpdate.length} products with expired sales`,
    },
    `Successfully restored original prices for ${productsToUpdate.length} products with expired sales`
  );
});

module.exports = {
  increaseAllPrices,
  applyDiscountToAll,
  setBulkPrices,
  getPriceAnalytics,
  restoreExpiredSales,
  restoreOriginalPrices,
};