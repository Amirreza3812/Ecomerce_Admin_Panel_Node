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
const {
  getCategoryIcons,
} = require("../../controllers/api/admin/iconController");
const { adminWithAudit } = require("../../middlewares/adminAuth");
const { validateCategory, validateCategoryPatch } = require("../../middlewares/validation");

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
 *         icon:
 *           type: string
 *           example: "coffee-icon.svg"
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
 *         icon:
 *           type: string
 *           example: "espresso-icon.svg"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: "active"
 *         sort_order:
 *           type: integer
 *           example: 1
 *     Icon:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "coffee-icon.svg"
 *         url:
 *           type: string
 *           example: "http://localhost:3000/icons/category-icons/coffee-icon.svg"
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
 * /api/v1/admin/categories/icons:
 *   get:
 *     summary: Get all available category icons
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category icons retrieved successfully
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
 *                     $ref: '#/components/schemas/Icon'
 *       401:
 *         description: Unauthorized - admin access required
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Category icons directory not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/icons",
  ...adminWithAudit("VIEW_CATEGORY_ICONS"),
  getCategoryIcons
);

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
 *         application/json:
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
 *               icon:
 *                 type: string
 *                 example: "coffee-icon.svg"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 example: "active"
 *               sort_order:
 *                 type: integer
 *                 example: 1
 *               subcategories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Espresso"
 *                     description:
 *                       type: string
 *                       example: "Strong black coffee"
 *                     icon:
 *                       type: string
 *                       example: "espresso-icon.svg"
 *                     status:
 *                       type: string
 *                       enum: [active, inactive]
 *                       default: active
 *                       example: "active"
 *                     sort_order:
 *                       type: integer
 *                       example: 1
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
  validateCategory,
  createCategory
);

/**
 * @swagger
 * /api/v1/admin/categories/{id}:
 *   patch:
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Coffee"
 *               description:
 *                 type: string
 *                 example: "Updated description for coffee category"
 *               icon:
 *                 type: string
 *                 example: "coffee-icon-updated.svg"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *               sort_order:
 *                 type: integer
 *                 example: 1
 *               subcategories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Espresso"
 *                     description:
 *                       type: string
 *                       example: "Strong black coffee"
 *                     icon:
 *                       type: string
 *                       example: "espresso-icon.svg"
 *                     status:
 *                       type: string
 *                       enum: [active, inactive]
 *                       example: "active"
 *                     sort_order:
 *                       type: integer
 *                       example: 1
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
router.patch(
  "/:id",
  ...adminWithAudit("UPDATE_CATEGORY"),
  validateCategoryPatch,
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