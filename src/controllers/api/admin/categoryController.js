// controllers/api/admin/categoryController.js
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const Category = require("../../../models/entities/Category");
const SubCategory = require("../../../models/entities/SubCategory");
const Product = require("../../../models/entities/Product");
const { Op } = require("sequelize");

// Get all categories with subcategories
const getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.findAll({
    include: [
      {
        model: SubCategory,
        as: "subcategories",
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["id", "name", "status"],
          },
        ],
      },
    ],
    order: [
      ["sort_order", "ASC"],
      ["name", "ASC"],
      [{ model: SubCategory, as: "subcategories" }, "sort_order", "ASC"],
    ],
  });

  res.json({
    success: true,
    data: categories,
  });
});

// Get single category
const getCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findByPk(id, {
    include: [
      {
        model: SubCategory,
        as: "subcategories",
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["id", "name", "price", "status"],
          },
        ],
      },
    ],
  });

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  res.json({
    success: true,
    data: category,
  });
});

// Create new category with subcategories
const createCategory = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    status = "active",
    sort_order = 0,
    icon,
    subcategories,
  } = req.body;

  // Check if category with same name already exists
  const existingCategory = await Category.findOne({ where: { name } });
  if (existingCategory) {
    return next(new AppError("Category with this name already exists", 400));
  }

  // Create category
  const category = await Category.create({
    name,
    description,
    icon,
    status,
    sort_order,
  });

  // Create subcategories if provided
  if (subcategories) {
    let parsedSubcategories = subcategories;

    if (typeof subcategories === "string") {
      try {
        parsedSubcategories = JSON.parse(subcategories);
      } catch (e) {
        return next(new AppError("Invalid subcategories format", 400));
      }
    }

    if (Array.isArray(parsedSubcategories) && parsedSubcategories.length > 0) {
      const validSubcategories = parsedSubcategories.filter(
        (sub) => sub && sub.name && sub.name.trim() !== ""
      );

      if (validSubcategories.length > 0) {
        const subcategoryData = validSubcategories.map((sub) => ({
          category_id: category.id,
          name: sub.name,
          description: sub.description || null,
          icon: sub.icon || null,
          status: sub.status || "active",
          sort_order: sub.sort_order || 0,
        }));

        await SubCategory.bulkCreate(subcategoryData);
      }
    }
  }

  const createdCategory = await Category.findByPk(category.id, {
    include: [
      {
        model: SubCategory,
        as: "subcategories",
        order: [["sort_order", "ASC"]],
      },
    ],
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: createdCategory,
  });
});

// Update category with subcategories (PATCH)
const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, status, sort_order, icon, subcategories } = req.body;

  const category = await Category.findByPk(id, {
    include: [
      {
        model: SubCategory,
        as: "subcategories",
        attributes: ["id", "name", "description", "icon", "status", "sort_order"],
      },
    ],
  });

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  // Check if another category with the same name exists
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return next(new AppError("Category with this name already exists", 400));
    }
  }

  // Only update fields that are explicitly provided in the request
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (icon !== undefined) updateData.icon = icon;
  if (status !== undefined) updateData.status = status;
  if (sort_order !== undefined) updateData.sort_order = sort_order;

  // Update category
  await category.update(updateData);

  // Handle subcategories ONLY if explicitly provided in the request
  if (subcategories !== undefined && subcategories !== null) {
    let parsedSubcategories = subcategories;

    if (typeof subcategories === "string") {
      try {
        parsedSubcategories = JSON.parse(subcategories);
      } catch (e) {
        return next(new AppError("Invalid subcategories format", 400));
      }
    }

    if (Array.isArray(parsedSubcategories)) {
      const existingSubcategories = category.subcategories || [];
      const existingIds = existingSubcategories.map((sub) => sub.id);
      
      // Get IDs of subcategories that are coming in the request
      const incomingIds = parsedSubcategories
        .filter((sub) => sub && sub.id) // Filter out items without an ID
        .map((sub) => sub.id);

      // Find subcategories to delete (exist but not in incoming list)
      const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
      
      // Delete subcategories that are no longer in the list
      if (toDelete.length > 0) {
        await SubCategory.destroy({
          where: { 
            id: toDelete,
            category_id: id // Ensure we only delete subcategories from this category
          },
        });
      }

      // Update or create subcategories
      await Promise.all(
        parsedSubcategories.map(async (sub) => {
          // Skip if the subcategory data is invalid
          if (!sub || !sub.name || sub.name.trim() === "") {
            return;
          }

          const subUpdateData = {
            name: sub.name,
            description: sub.description || null,
            icon: sub.icon || null,
            status: sub.status || "active",
            sort_order: sub.sort_order || 0,
          };

          if (sub.id) {
            // Update existing subcategory
            await SubCategory.update(subUpdateData, {
              where: { 
                id: sub.id, 
                category_id: id // Ensure we only update subcategories from this category
              },
            });
          } else {
            // Create new subcategory
            await SubCategory.create({
              category_id: id,
              ...subUpdateData,
            });
          }
        })
      );
    }
  }

  // Fetch the updated category with all associations
  const updatedCategory = await Category.findByPk(id, {
    include: [
      {
        model: SubCategory,
        as: "subcategories",
        include: [
          {
            model: Product,
            as: "products",
            attributes: ["id", "name", "status"],
          },
        ],
        order: [["sort_order", "ASC"]],
      },
    ],
  });

  res.json({
    success: true,
    message: "Category updated successfully",
    data: updatedCategory,
  });
});

// Delete category
const deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findByPk(id, {
    include: [{ model: SubCategory, as: "subcategories" }],
  });

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  if (category.subcategories && category.subcategories.length > 0) {
    return next(
      new AppError("Cannot delete category with existing subcategories", 400)
    );
  }

  await category.destroy();

  res.json({
    success: true,
    message: "Category deleted successfully",
  });
});

// Get category statistics
const getCategoryStats = catchAsync(async (req, res, next) => {
  const totalCategories = await Category.count();
  const activeCategories = await Category.count({
    where: { status: "active" },
  });

  const totalSubcategories = await SubCategory.count();
  const totalProducts = await Product.count();

  res.json({
    success: true,
    data: {
      totalCategories,
      activeCategories,
      totalSubcategories,
      totalProducts,
    },
  });
});

module.exports = {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
};