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
    status = "active",
    sort_order = 0,
    subcategories,
  } = req.body;

  // Handle image upload
  let image = null;
  if (req.files && req.files.image) {
    image = `${req.protocol}://${req.get("host")}/uploads/${
      req.files.image.filename
    }`;
  }

  // Check if category with same name already exists
  const existingCategory = await Category.findOne({ where: { name } });
  if (existingCategory) {
    return next(new AppError("Category with this name already exists", 400));
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

    if (typeof subcategories === "string") {
      try {
        parsedSubcategories = JSON.parse(subcategories);
      } catch (e) {
        return next(new AppError("Invalid subcategories format", 400));
      }
    }

    if (Array.isArray(parsedSubcategories) && parsedSubcategories.length > 0) {
      // FIX: Filter out any subcategory objects that are empty or have no name
      const validSubcategories = parsedSubcategories.filter(
        (sub) => sub && sub.name && sub.name.trim() !== ""
      );

      if (validSubcategories.length > 0) {
        const subcategoryData = validSubcategories.map((sub, index) => {
          let subcategoryImage = sub.image || null;

          if (req.files) {
            const imageFieldName = `subcategoryImage_${index}`;
            if (req.files[imageFieldName]) {
              subcategoryImage = `${req.protocol}://${req.get(
                "host"
              )}/uploads/${req.files[imageFieldName].filename}`;
            }
          }

          return {
            category_id: category.id,
            name: sub.name,
            description: sub.description || null,
            image: subcategoryImage,
            status: sub.status || "active",
            sort_order: sub.sort_order || 0,
          };
        });

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

  // Handle image upload
  let image = category.image;
  if (req.files && req.files.image) {
    if (category.image) {
      deleteImage(category.image);
    }
    image = `${req.protocol}://${req.get("host")}/uploads/${
      req.files.image.filename
    }`;
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

    if (typeof subcategories === "string") {
      try {
        parsedSubcategories = JSON.parse(subcategories);
      } catch (e) {
        return next(new AppError("Invalid subcategories format", 400));
      }
    }

    if (Array.isArray(parsedSubcategories)) {
      const existingSubcategories = await SubCategory.findAll({
        where: { category_id: id },
      });
      const existingIds = existingSubcategories.map((sub) => sub.id);
      const incomingIds = parsedSubcategories
        .filter((sub) => sub.id) // Filter out items without an ID
        .map((sub) => sub.id);

      const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
      if (toDelete.length > 0) {
        await SubCategory.destroy({
          where: { id: toDelete },
        });
      }

      parsedSubcategories.forEach((sub, index) => {
        // FIX: Skip if the subcategory data is invalid (e.g., empty object from frontend)
        if (!sub || !sub.name || sub.name.trim() === "") {
          return; // Skip this iteration
        }

        let subcategoryImage = sub.image || null;
        if (req.files) {
          const imageFieldName = `subcategoryImage_${index}`;
          if (req.files[imageFieldName]) {
            subcategoryImage = `${req.protocol}://${req.get("host")}/uploads/${
              req.files[imageFieldName].filename
            }`;
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

  if (category.subcategories && category.subcategories.length > 0) {
    return next(
      new AppError("Cannot delete category with existing subcategories", 400)
    );
  }

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
