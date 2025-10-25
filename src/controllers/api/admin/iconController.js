const fs = require('fs');
const path = require('path');
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

// Get all available category icons
const getCategoryIcons = catchAsync(async (req, res, next) => {
  const iconsDir = path.join(__dirname, "../../../../icons/category-icons");
  
  try {
    // Check if directory exists
    if (!fs.existsSync(iconsDir)) {
      return next(new AppError("Category icons directory not found", 404));
    }
    
    const files = fs.readdirSync(iconsDir);
    const icons = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.svg', '.gif'].includes(ext);
    }).map(file => ({
      name: file,
      url: `${req.protocol}://${req.get("host")}/icons/category-icons/${file}`
    }));
    
    res.json({
      success: true,
      data: icons
    });
  } catch (error) {
    return next(new AppError("Error reading category icons", 500));
  }
});

// Get all available subcategory icons
const getSubCategoryIcons = catchAsync(async (req, res, next) => {
  const iconsDir = path.join(__dirname, "../../../../icons/subcategory-icons");
  
  try {
    // Check if directory exists
    if (!fs.existsSync(iconsDir)) {
      return next(new AppError("Subcategory icons directory not found", 404));
    }
    
    const files = fs.readdirSync(iconsDir);
    const icons = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.svg', '.gif'].includes(ext);
    }).map(file => ({
      name: file,
      url: `${req.protocol}://${req.get("host")}/icons/subcategory-icons/${file}`
    }));
    
    res.json({
      success: true,
      data: icons
    });
  } catch (error) {
    return next(new AppError("Error reading subcategory icons", 500));
  }
});

module.exports = {
  getCategoryIcons,
  getSubCategoryIcons
};