// controllers/api/admin/subcategoryController.js
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const SubCategory = require("../../../models/entities/SubCategory");
const Category = require("../../../models/entities/Category");
const Product = require("../../../models/entities/Product");
const fs = require('fs');
const path = require('path');

// Helper function to delete old image
const deleteImage = (imagePath) => {
  if (imagePath) {
    const filename = imagePath.split('/').pop();
    const fullPath = path.join(__dirname, '../../../uploads', filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

// Get all subcategories
const getAllSubCategories = catchAsync(async (req, res, next) => {
  const { categoryId, status } = req.query;
  
  const whereClause = {};
  if (categoryId) whereClause.category_id = categoryId;
  if (status) whereClause.status = status;
  
  const subcategories = await SubCategory.findAll({
    where: whereClause,
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name"]
      },
      {
        model: Product,
        as: "products",
        attributes: ["id", "name", "status"]
      }
    ],
    order: [["sort_order", "ASC"], ["name", "ASC"]]
  });

  res.json({
    success: true,
    data: subcategories
  });
});

// Get single subcategory
const getSubCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const subcategory = await SubCategory.findByPk(id, {
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name"]
      },
      {
        model: Product,
        as: "products",
        attributes: ["id", "name", "status"]
      }
    ]
  });

  if (!subcategory) {
    return next(new AppError('Subcategory not found', 404));
  }

  res.json({
    success: true,
    data: subcategory
  });
});

// Create new subcategory
const createSubCategory = catchAsync(async (req, res, next) => {
  const { 
    category_id, 
    name, 
    description, 
    status = 'active', 
    sort_order = 0 
  } = req.body;

  // Check if category exists
  const category = await Category.findByPk(category_id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Check if subcategory with same name already exists in this category
  const existingSubCategory = await SubCategory.findOne({ 
    where: { category_id, name } 
  });
  if (existingSubCategory) {
    return next(new AppError('Subcategory with this name already exists in this category', 400));
  }

  // Handle image upload
  let image = null;
  if (req.file) {
    image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  }

  const subcategory = await SubCategory.create({
    category_id,
    name,
    description,
    image,
    status,
    sort_order,
  });

  // Fetch the created subcategory with category
  const createdSubCategory = await SubCategory.findByPk(subcategory.id, {
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name"]
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: "Subcategory created successfully",
    data: createdSubCategory
  });
});

// Update subcategory
const updateSubCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { 
    category_id, 
    name, 
    description, 
    status, 
    sort_order 
  } = req.body;

  const subcategory = await SubCategory.findByPk(id);
  if (!subcategory) {
    return next(new AppError('Subcategory not found', 404));
  }

  // If category_id is being changed, check if the new category exists
  if (category_id && category_id !== subcategory.category_id) {
    const category = await Category.findByPk(category_id);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }
  }

  // Check if another subcategory with the same name exists in the same category
  if (name && (name !== subcategory.name || category_id !== subcategory.category_id)) {
    const existingSubCategory = await SubCategory.findOne({ 
      where: { 
        category_id: category_id || subcategory.category_id, 
        name 
      } 
    });
    if (existingSubCategory) {
      return next(new AppError('Subcategory with this name already exists in this category', 400));
    }
  }

  // Handle image upload
  let image = subcategory.image;
  if (req.file) {
    // Delete old image if exists
    if (subcategory.image) {
      deleteImage(subcategory.image);
    }
    image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  }

  await subcategory.update({
    category_id: category_id || subcategory.category_id,
    name: name || subcategory.name,
    description: description !== undefined ? description : subcategory.description,
    image,
    status: status || subcategory.status,
    sort_order: sort_order !== undefined ? sort_order : subcategory.sort_order,
  });

  // Fetch the updated subcategory with category
  const updatedSubCategory = await SubCategory.findByPk(id, {
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name"]
      }
    ]
  });

  res.json({
    success: true,
    message: "Subcategory updated successfully",
    data: updatedSubCategory
  });
});

// Delete subcategory
const deleteSubCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const subcategory = await SubCategory.findByPk(id, {
    include: [
      {
        model: Product,
        as: "products"
      }
    ]
  });

  if (!subcategory) {
    return next(new AppError('Subcategory not found', 404));
  }

  // Check if subcategory has products
  if (subcategory.products && subcategory.products.length > 0) {
    return next(new AppError('Cannot delete subcategory with existing products', 400));
  }

  // Delete subcategory image if exists
  if (subcategory.image) {
    deleteImage(subcategory.image);
  }

  await subcategory.destroy();

  res.json({
    success: true,
    message: "Subcategory deleted successfully"
  });
});

// Toggle subcategory status
const toggleSubCategoryStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const subcategory = await SubCategory.findByPk(id);
  if (!subcategory) {
    return next(new AppError('Subcategory not found', 404));
  }

  const newStatus = subcategory.status === 'active' ? 'inactive' : 'active';
  await subcategory.update({ status: newStatus });

  res.json({
    success: true,
    message: `Subcategory ${newStatus}d successfully`,
    data: subcategory
  });
});

module.exports = {
  getAllSubCategories,
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  toggleSubCategoryStatus
};