const multer = require("multer");
const path = require("path");

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    );
  },
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif|webp/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Images only!"));
  }
};

// Initialize upload variable for single file
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Initialize upload variable for multiple files (for subcategories)
const uploadMultiple = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: fileFilter,
});

// Custom middleware for category update with subcategory images
const uploadCategoryWithSubcategories = (req, res, next) => {
  // Use multer to handle multiple files with specific field names
  const uploader = uploadMultiple.fields([
    { name: 'image', maxCount: 1 }, // Main category image
    { name: 'subcategoryImage_0', maxCount: 1 },
    { name: 'subcategoryImage_1', maxCount: 1 },
    { name: 'subcategoryImage_2', maxCount: 1 },
    { name: 'subcategoryImage_3', maxCount: 1 },
    { name: 'subcategoryImage_4', maxCount: 1 },
    { name: 'subcategoryImage_5', maxCount: 1 },
    { name: 'subcategoryImage_6', maxCount: 1 },
    { name: 'subcategoryImage_7', maxCount: 1 },
    { name: 'subcategoryImage_8', maxCount: 1 },
    { name: 'subcategoryImage_9', maxCount: 1 },
    // Add more as needed
  ]);

  uploader(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    // Convert req.files to a more convenient format
    if (req.files) {
      const files = {};
      Object.keys(req.files).forEach(fieldname => {
        if (req.files[fieldname] && req.files[fieldname].length > 0) {
          files[fieldname] = req.files[fieldname][0];
        }
      });
      req.files = files;
    }
    
    next();
  });
};

module.exports = { upload, uploadMultiple, uploadCategoryWithSubcategories };