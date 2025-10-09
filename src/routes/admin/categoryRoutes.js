// routes/admin/categories.js
const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
} = require("../../controllers/api/admin/categoryController");
const { adminWithAudit } = require("../../middlewares/adminAuth");
const { validateCategory } = require("../../middlewares/validation");
const { upload, uploadMultiple } = require("../../middlewares/upload");

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Coffee"
 *         description:
 *           type: string
 *           example: "Various coffee drinks and beverages"
 *         image:
 *           type: string
 *           example: "https://example.com/coffee.jpg"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: "active"
 *         sort_order:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-06T16:47:26.204Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-06T16:47:26.204Z"
 *         subcategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubCategory'
 *     SubCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Espresso"
 *         description:
 *           type: string
 *           example: "Strong black coffee"
 *         image:
 *           type: string
 *           example: "https://example.com/espresso.jpg"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: "active"
 *         sort_order:
 *           type: integer
 *           example: 1
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Error message"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/v1/admin/categories:
 *   get:
 *     summary: Get all categories (Admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized - admin access required
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get("/", ...adminWithAudit("VIEW_CATEGORIES"), getAllCategories);

/**
 * @swagger
 * /api/v1/admin/categories/stats:
 *   get:
 *     summary: Get category statistics (Admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category statistics retrieved successfully
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
 *                     totalCategories:
 *                       type: integer
 *                       example: 15
 *                     activeCategories:
 *                       type: integer
 *                       example: 12
 *                     totalSubcategories:
 *                       type: integer
 *                       example: 8
 *                     totalProducts:
 *                       type: integer
 *                       example: 45
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/stats",
  ...adminWithAudit("VIEW_CATEGORY_STATS"),
  getCategoryStats
);

/**
 * @swagger
 * /api/v1/admin/categories/{id}:
 *   get:
 *     summary: Get single category (Admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: Category ID
 *           example: 1
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", ...adminWithAudit("VIEW_CATEGORY"), getCategory);

/**
 * @swagger
 * /api/v1/admin/categories:
 *   post:
 *     summary: Create new category (Admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Coffee"
 *               description:
 *                 type: string
 *                 example: "Various coffee drinks and beverages"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 example: "active"
 *               sort_order:
 *                 type: integer
 *                 example: 1
 *               image:
 *                 type: string
 *                 format: binary
 *               subcategories:
 *                 type: string
 *                 description: JSON string array of subcategories
 *                 example: '[{"name":"Espresso","description":"Strong black coffee","status":"active","sort_order":1}]'
 *     responses:
 *       201:
 *         description: Category created successfully
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
 *                   example: "Category created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  ...adminWithAudit("CREATE_CATEGORY"),
  require("../../middlewares/upload").uploadCategoryWithSubcategories,
  validateCategory,
  createCategory
);

/**
 * @swagger
 * /api/v1/admin/categories/{id}:
 *   put:
 *     summary: Update category (Admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: Category ID
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Coffee"
 *               description:
 *                 type: string
 *                 example: "Updated description for coffee category"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *               sort_order:
 *                 type: integer
 *                 example: 1
 *               image:
 *                 type: string
 *                 format: binary
 *               subcategories:
 *                 type: string
 *                 description: JSON string array of subcategories
 *                 example: '[{"id":1,"name":"Espresso","description":"Strong black coffee","status":"active","sort_order":1}]'
 *     responses:
 *       200:
 *         description: Category updated successfully
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
 *                   example: "Category updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Update category (with file upload support)
router.put(
  "/:id",
  ...adminWithAudit("UPDATE_CATEGORY"),
  require("../../middlewares/upload").uploadCategoryWithSubcategories,
  validateCategory,
  updateCategory
);
/**
 * @swagger
 * /api/v1/admin/categories/{id}:
 *   delete:
 *     summary: Delete category (Admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: Category ID
 *           example: 1
 *     responses:
 *       200:
 *         description: Category deleted successfully
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
 *                   example: "Category deleted successfully"
 *       400:
 *         description: Cannot delete category with existing subcategories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", ...adminWithAudit("DELETE_CATEGORY"), deleteCategory);

module.exports = router;
