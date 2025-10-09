// controllers/api/admin/categoryController.js

const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const Category = require("../../../models/entities/Category");
const SubCategory = require("../../../models/entities/SubCategory");
const Product = require("../../../models/entities/Product");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");

// Helper function to delete old image
const deleteImage = (imagePath) => {
  if (imagePath) {
    try {
      const filename = imagePath.split("/").pop();
      const fullPath = path.join(__dirname, "../../../uploads", filename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  }
};

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
    status = 'active', 
    sort_order = 0,
    subcategories 
  } = req.body;

  // Handle main category image upload from req.files
  let image = null;
  if (req.files && req.files.image) {
    image = `${req.protocol}://${req.get("host")}/uploads/${req.files.image.filename}`;
  }

  // Check if category with same name already exists
  const existingCategory = await Category.findOne({ where: { name } });
  if (existingCategory) {
    return next(new AppError('Category with this name already exists', 400));
  }

  // Create category
  const category = await Category.create({
    name,
    description,
    image,
    status,
    sort_order,
  });

  // Create subcategories if provided
  if (subcategories) {
    let parsedSubcategories = subcategories;
    
    // Parse subcategories if it's a string (from FormData)
    if (typeof subcategories === 'string') {
      try {
        parsedSubcategories = JSON.parse(subcategories);
      } catch (e) {
        return next(new AppError('Invalid subcategories format', 400));
      }
    }

    // Make sure we have an array
    if (Array.isArray(parsedSubcategories) && parsedSubcategories.length > 0) {
      const subcategoryData = parsedSubcategories.map((sub, index) => {
        // Check if there's an image file for this subcategory using its index
        let subcategoryImage = sub.image || null;
        
        if (req.files) {
          const imageFieldName = `subcategoryImage_${index}`;
          if (req.files[imageFieldName]) {
            subcategoryImage = `${req.protocol}://${req.get("host")}/uploads/${req.files[imageFieldName].filename}`;
          }
        }
        
        return {
          category_id: category.id,
          name: sub.name,
          description: sub.description || null,
          image: subcategoryImage,
          status: sub.status || 'active',
          sort_order: sub.sort_order || 0,
        };
      });
      
      await SubCategory.bulkCreate(subcategoryData);
    }
  }

  // Fetch the created category with subcategories
  const createdCategory = await Category.findByPk(category.id, {
    include: [{
      model: SubCategory,
      as: "subcategories",
      order: [["sort_order", "ASC"]]
    }]
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: createdCategory,
  });
});

// Update category with subcategories
const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, status, sort_order, subcategories } = req.body;

  const category = await Category.findByPk(id);
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

  // Handle main category image upload from req.files
  let image = category.image;
  if (req.files && req.files.image) {
    // Delete old image if exists
    if (category.image) {
      deleteImage(category.image);
    }
    image = `${req.protocol}://${req.get("host")}/uploads/${req.files.image.filename}`;
  }

  // Update category
  await category.update({
    name: name || category.name,
    description: description !== undefined ? description : category.description,
    image,
    status: status || category.status,
    sort_order: sort_order !== undefined ? sort_order : category.sort_order,
  });

  // Handle subcategories if provided
  if (subcategories !== undefined) {
    let parsedSubcategories = subcategories;

    // Parse subcategories if it's a string (from FormData)
    if (typeof subcategories === "string") {
      try {
        parsedSubcategories = JSON.parse(subcategories);
      } catch (e) {
        return next(new AppError("Invalid subcategories format", 400));
      }
    }

    // Make sure we have an array
    if (Array.isArray(parsedSubcategories)) {
      // Get existing subcategories
      const existingSubcategories = await SubCategory.findAll({
        where: { category_id: id },
      });
      const existingIds = existingSubcategories.map((sub) => sub.id);
      const incomingIds = parsedSubcategories
        .filter((sub) => sub.id)
        .map((sub) => sub.id);

      // Delete subcategories that are not in the incoming list
      const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
      if (toDelete.length > 0) {
        // Also delete their images before deleting the records
        const subcategoriesToDelete = existingSubcategories.filter(sub => toDelete.includes(sub.id));
        subcategoriesToDelete.forEach(sub => {
            if(sub.image) deleteImage(sub.image);
        });
        await SubCategory.destroy({
          where: { id: toDelete },
        });
      }

      // Update or create subcategories using forEach for safe index access
      parsedSubcategories.forEach((sub, index) => {
        // Check if there's an image file for this subcategory using its index
        let subcategoryImage = sub.image || null;

        if (req.files) {
          const imageFieldName = `subcategoryImage_${index}`;
          if (req.files[imageFieldName]) {
            subcategoryImage = `${req.protocol}://${req.get(
              "host"
            )}/uploads/${req.files[imageFieldName].filename}`;
          }
        }

        if (sub.id) {
          // Update existing subcategory
          SubCategory.update(
            {
              name: sub.name,
              description: sub.description,
              image: subcategoryImage,
              status: sub.status,
              sort_order: sub.sort_order,
            },
            {
              where: { id: sub.id, category_id: id },
            }
          );
        } else {
          // Create new subcategory
          SubCategory.create({
            category_id: id,
            name: sub.name,
            description: sub.description,
            image: subcategoryImage,
            status: sub.status,
            sort_order: sub.sort_order,
          });
        }
      });
    }
  }

  // Fetch the updated category with subcategories
  const updatedCategory = await Category.findByPk(id, {
    include: [
      {
        model: SubCategory,
        as: "subcategories",
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

  // Check if category has subcategories
  if (category.subcategories && category.subcategories.length > 0) {
    return next(
      new AppError("Cannot delete category with existing subcategories", 400)
    );
  }

  // Delete category image if exists
  if (category.image) {
    deleteImage(category.image);
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

  // Count subcategories
  const totalSubcategories = await SubCategory.count();

  // Count products
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