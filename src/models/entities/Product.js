// src/models/entities/Product.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");
const { Op } = require("sequelize");

const Product = sequelize.define(
  "Product",
  {
    subcategory_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "subcategories",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    sale_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
      comment: "Sale price of the product, if applicable",
    },
    sale_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Start date for the sale period",
    },
    sale_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "End date for the sale period",
    },
    cost_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Cost for profit calculation",
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Product image URL",
    },
    gallery: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Additional product images",
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    min_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      comment: "Low stock alert threshold",
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "out_of_stock"),
      defaultValue: "active",
      allowNull: false,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Show in featured products",
    },
    preparation_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Preparation time in minutes",
    },
    ingredients: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Product ingredients list",
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    allergens: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "List of allergens",
    },
    sizes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Available sizes with prices",
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0,
      validate: {
        min: 0,
        max: 5,
      },
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    tableName: "products",
    indexes: [
      { fields: ["subcategory_id"] },
      { fields: ["status"] },
      { fields: ["is_featured"] },
      { fields: ["rating"] },
      { fields: ["total_reviews"] },
      { unique: true, fields: ["name"] },
    ],
    // Add virtual getters
    getterMethods: {
      // Check if product is currently on sale
      isOnSale() {
        if (!this.sale_price || !this.sale_start_date || !this.sale_end_date) {
          return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for comparison

        const startDate = new Date(this.sale_start_date);
        const endDate = new Date(this.sale_end_date);

        return today >= startDate && today <= endDate;
      },

      // Get current price (sale price if on sale, otherwise regular price)
      currentPrice() {
        return this.isOnSale ? this.sale_price : this.price;
      },

      // Calculate discount percentage
      discountPercentage() {
        if (!this.isOnSale || !this.price || !this.sale_price) {
          return 0;
        }
        return Math.round(((this.price - this.sale_price) / this.price) * 100);
      },

      // Get rating distribution (async method)
      async getRatingDistribution() {
        const { Comment } = require("../associations");

        const ratingDistribution = await Comment.findAll({
          where: {
            product_id: this.id,
            rating: { [Op.not]: null },
            status: "approved",
          },
          attributes: [
            "rating",
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          group: ["rating"],
          raw: true,
        });

        // Initialize distribution object
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        // Fill distribution with actual counts
        ratingDistribution.forEach((item) => {
          distribution[item.rating] = parseInt(item.count);
        });

        return distribution;
      },

      // Check if product is low on stock
      isLowStock() {
        return this.stock <= this.min_stock;
      },

      // Check if product is out of stock
      isOutOfStock() {
        return this.stock <= 0;
      },

      // Get profit margin
      profitMargin() {
        if (!this.cost_price || this.cost_price <= 0) {
          return null;
        }
        const currentPrice = this.currentPrice;
        return Math.round(
          ((currentPrice - this.cost_price) / currentPrice) * 100
        );
      },

      // Get formatted price with currency
      formattedPrice() {
        return `$${this.currentPrice.toFixed(2)}`;
      },

      // Get formatted original price with currency
      formattedOriginalPrice() {
        return `$${this.price.toFixed(2)}`;
      },

      // Get formatted sale price with currency
      formattedSalePrice() {
        if (!this.sale_price) return null;
        return `$${this.sale_price.toFixed(2)}`;
      },
    },
    // Add instance methods
    instanceMethods: {
      // Update product rating
      async updateRating() {
        const { Comment, sequelize } = require("../associations");

        const ratingStats = await Comment.findOne({
          where: {
            product_id: this.id,
            rating: { [Op.not]: null },
            status: "approved",
          },
          attributes: [
            [sequelize.fn("AVG", sequelize.col("rating")), "avgRating"],
            [sequelize.fn("COUNT", sequelize.col("id")), "totalReviews"],
          ],
          raw: true,
        });

        await this.update({
          rating: parseFloat(ratingStats.avgRating || 0).toFixed(2),
          total_reviews: parseInt(ratingStats.totalReviews || 0),
        });

        return this.reload();
      },

      // Decrease stock
      async decreaseStock(quantity) {
        if (quantity <= 0) {
          throw new Error("Quantity must be greater than 0");
        }

        if (this.stock < quantity) {
          throw new Error("Insufficient stock");
        }

        const newStock = this.stock - quantity;
        await this.update({
          stock: newStock,
          status: newStock <= 0 ? "out_of_stock" : this.status,
        });

        return this.reload();
      },

      // Increase stock
      async increaseStock(quantity) {
        if (quantity <= 0) {
          throw new Error("Quantity must be greater than 0");
        }

        const newStock = this.stock + quantity;
        await this.update({
          stock: newStock,
          status:
            newStock > 0 && this.status === "out_of_stock"
              ? "active"
              : this.status,
        });

        return this.reload();
      },
    },
    // Add class methods
    classMethods: {
      // Find products on sale
      async findOnSale(limit = 10) {
        const today = new Date().toISOString().split("T")[0];

        return await this.findAll({
          where: {
            status: "active",
            sale_price: { [Op.not]: null },
            sale_start_date: { [Op.lte]: today },
            sale_end_date: { [Op.gte]: today },
          },
          order: [
            [sequelize.literal("((price - sale_price) / price) * 100"), "DESC"],
            ["rating", "DESC"],
          ],
          limit,
        });
      },

      // Find top rated products
      async findTopRated(limit = 10, minReviews = 3) {
        return await this.findAll({
          where: {
            status: "active",
            total_reviews: { [Op.gte]: minReviews },
          },
          order: [
            ["rating", "DESC"],
            ["total_reviews", "DESC"],
          ],
          limit,
        });
      },

      // Find featured products
      async findFeatured(limit = 8) {
        return await this.findAll({
          where: {
            status: "active",
            is_featured: true,
          },
          order: [
            ["rating", "DESC"],
            ["total_reviews", "DESC"],
          ],
          limit,
        });
      },

      // Search products
      async search(query, options = {}) {
        const {
          page = 1,
          limit = 12,
          categoryId,
          subcategoryId,
          minPrice,
          maxPrice,
          minRating,
          sortBy = "name",
          sortOrder = "ASC",
        } = options;

        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause = {
          status: "active",
          [Op.or]: [
            { name: { [Op.like]: `%${query}%` } },
            { description: { [Op.like]: `%${query}%` } },
          ],
        };

        // Add filters
        if (minPrice || maxPrice) {
          whereClause.price = {};
          if (minPrice) whereClause.price[Op.gte] = minPrice;
          if (maxPrice) whereClause.price[Op.lte] = maxPrice;
        }

        if (minRating) {
          whereClause.rating = { [Op.gte]: minRating };
        }

        // Build include clause for category/subcategory filters
        const include = [
          {
            model: require("./SubCategory"),
            as: "subcategory",
            include: [
              {
                model: require("./Category"),
                as: "category",
              },
            ],
          },
        ];

        if (subcategoryId) {
          whereClause.subcategory_id = subcategoryId;
        } else if (categoryId) {
          include[0].include[0].where = { id: categoryId };
        }

        // Build order clause
        const order = [];
        switch (sortBy) {
          case "price":
            order.push(["price", sortOrder]);
            break;
          case "rating":
            order.push(["rating", sortOrder]);
            break;
          case "reviews":
            order.push(["total_reviews", sortOrder]);
            break;
          case "newest":
            order.push(["createdAt", sortOrder]);
            break;
          default:
            order.push(["name", sortOrder]);
        }

        const { count, rows } = await this.findAndCountAll({
          where: whereClause,
          include,
          order,
          limit,
          offset,
        });

        return {
          products: rows,
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit),
          },
        };
      },
    },
  }
);

module.exports = Product;
