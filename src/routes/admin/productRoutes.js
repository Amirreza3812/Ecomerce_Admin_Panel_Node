const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getProductStats, // <-- IMPORT the new controller function
} = require("../../controllers/api/admin/productController");

const { adminWithAudit } = require("../../middlewares/adminAuth");
const {
  validateProduct,
  handleValidationErrors,
} = require("../../middlewares/validation");
const { upload } = require("../../middlewares/upload");

// Routes

/**
 * @swagger
 * /api/v1/admin/products:
 *   get:
 *     summary: Get all products (Admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: integer
 *         description: Filter by subcategory ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get("/", ...adminWithAudit("VIEW_PRODUCTS"), getAllProducts);

/**
 * @swagger
 * /api/v1/admin/products/stats:
 *   get:
 *     summary: Get product statistics (Admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                       example: 150
 *                     activeProducts:
 *                       type: integer
 *                       example: 120
 *                     inactiveProducts:
 *                       type: integer
 *                       example: 25
 *                     outOfStockProducts:
 *                       type: integer
 *                       example: 5
 *                     lowStockProducts:
 *                       type: integer
 *                       example: 10
 *                     featuredProducts:
 *                       type: integer
 *                       example: 15
 *                     totalStockValue:
 *                       type: string
 *                       example: "4850.75"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get("/stats", ...adminWithAudit("VIEW_PRODUCT_STATS"), getProductStats);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   get:
 *     summary: Get single product (Admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get("/:id", ...adminWithAudit("VIEW_PRODUCT"), getProduct);

/**
 * @swagger
 * /api/v1/admin/products:
 *   post:
 *     summary: Create a new product (Admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - category_id
 *               - subcategory_id
 *               - name
 *               - price
 *             properties:
 *               category_id:
 *                 type: integer
 *                 description: ID of the parent category
 *                 example: 1
 *               subcategory_id:
 *                 type: integer
 *                 description: ID of the subcategory
 *                 example: 5
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: "Cappuccino"
 *               price:
 *                 type: number
 *                 format: decimal
 *                 description: Product price
 *                 example: 4.50
 *               sale_price:
 *                 type: number
 *                 format: decimal
 *                 description: Optional sale price
 *                 example: 3.99
 *               sale_start_date:
 *                 type: string
 *                 format: date
 *                 description: Optional sale start date (YYYY-MM-DD)
 *                 example: "2025-10-15"
 *               sale_end_date:
 *                 type: string
 *                 format: date
 *                 description: Optional sale end date (YYYY-MM-DD)
 *                 example: "2025-10-25"
 *               description:
 *                 type: string
 *                 description: Product description
 *                 example: "Rich espresso with steamed milk and foam"
 *               ingredients:
 *                 type: string
 *                 description: Product ingredients
 *                 example: "Espresso, Steamed milk, Milk foam"
 *               stock:
 *                 type: integer
 *                 description: Available stock
 *                 example: 25
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Product status
 *                 example: "active"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image file
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post(
  "/",
  ...adminWithAudit("CREATE_PRODUCT"),
  upload.single("image"),
  validateProduct,
  createProduct
);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   put:
 *     summary: Update a product (Admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               category_id:
 *                 type: integer
 *                 description: ID of the parent category
 *                 example: 1
 *               subcategory_id:
 *                 type: integer
 *                 description: ID of the subcategory
 *                 example: 5
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: "Cappuccino"
 *               price:
 *                 type: number
 *                 format: decimal
 *                 description: Product price
 *                 example: 4.50
 *               sale_price:
 *                 type: number
 *                 format: decimal
 *                 description: Optional sale price
 *                 example: 3.99
 *               sale_start_date:
 *                 type: string
 *                 format: date
 *                 description: Optional sale start date (YYYY-MM-DD)
 *                 example: "2025-10-15"
 *               sale_end_date:
 *                 type: string
 *                 format: date
 *                 description: Optional sale end date (YYYY-MM-DD)
 *                 example: "2025-10-25"
 *               description:
 *                 type: string
 *                 description: Product description
 *                 example: "Rich espresso with steamed milk and foam"
 *               ingredients:
 *                 type: string
 *                 description: Product ingredients
 *                 example: "Espresso, Steamed milk, Milk foam"
 *               stock:
 *                 type: integer
 *                 description: Available stock
 *                 example: 25
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Product status
 *                 example: "active"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image file
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.put(
  "/:id",
  ...adminWithAudit("UPDATE_PRODUCT"),
  upload.single("image"),
  validateProduct,
  updateProduct
);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   delete:
 *     summary: Delete a product (Admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product deleted successfully"
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.delete("/:id", ...adminWithAudit("DELETE_PRODUCT"), deleteProduct);

/**
 * @swagger
 * /api/v1/admin/products/{id}/status:
 *   patch:
 *     summary: Toggle product status (Admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Product status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product activated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "active"
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.patch(
  "/:id/status",
  ...adminWithAudit("TOGGLE_PRODUCT_STATUS"),
  toggleProductStatus
);

module.exports = router;
