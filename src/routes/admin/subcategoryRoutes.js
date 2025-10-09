// routes/admin/subcategories.js
const express = require('express');
const router = express.Router();
const {
  getAllSubCategories,
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  toggleSubCategoryStatus
} = require('../../controllers/api/admin/subcategoryController');

const { adminWithAudit } = require('../../middlewares/adminAuth');
const { validateSubCategory } = require('../../middlewares/validation');
const {upload} = require('../../middlewares/upload');

/**
 * @swagger
 * components:
 *   schemas:
 *     SubCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         category_id:
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-06T16:47:26.204Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-06T16:47:26.204Z"
 *         category:
 *           $ref: '#/components/schemas/Category'
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/v1/admin/subcategories:
 *   get:
 *     summary: Get all subcategories (Admin)
 *     tags: [Admin - SubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Subcategories retrieved successfully
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
 *                     $ref: '#/components/schemas/SubCategory'
 *       401:
 *         description: Unauthorized - admin access required
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/',
  ...adminWithAudit('VIEW_SUBCATEGORIES'),
  getAllSubCategories
);

/**
 * @swagger
 * /api/v1/admin/subcategories/{id}:
 *   get:
 *     summary: Get single subcategory (Admin)
 *     tags: [Admin - SubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: Subcategory ID
 *           example: 1
 *     responses:
 *       200:
 *         description: Subcategory retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SubCategory'
 *       404:
 *         description: Subcategory not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id',
  ...adminWithAudit('VIEW_SUBCATEGORY'),
  getSubCategory
);

/**
 * @swagger
 * /api/v1/admin/subcategories:
 *   post:
 *     summary: Create new subcategory (Admin)
 *     tags: [Admin - SubCategories]
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
 *               - name
 *             properties:
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "Espresso"
 *               description:
 *                 type: string
 *                 example: "Strong black coffee"
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
 *     responses:
 *       201:
 *         description: Subcategory created successfully
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
 *                   example: "Subcategory created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SubCategory'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/',
  ...adminWithAudit('CREATE_SUBCATEGORY'),
  upload.single('image'),
  validateSubCategory,
  createSubCategory
);

/**
 * @swagger
 * /api/v1/admin/subcategories/{id}:
 *   put:
 *     summary: Update subcategory (Admin)
 *     tags: [Admin - SubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: Subcategory ID
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "Updated Espresso"
 *               description:
 *                 type: string
 *                 example: "Updated description for espresso"
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
 *     responses:
 *       200:
 *         description: Subcategory updated successfully
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
 *                   example: "Subcategory updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SubCategory'
 *       404:
 *         description: Subcategory not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id',
  ...adminWithAudit('UPDATE_SUBCATEGORY'),
  upload.single('image'),
  validateSubCategory,
  updateSubCategory
);

/**
 * @swagger
 * /api/v1/admin/subcategories/{id}:
 *   delete:
 *     summary: Delete subcategory (Admin)
 *     tags: [Admin - SubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: Subcategory ID
 *           example: 1
 *     responses:
 *       200:
 *         description: Subcategory deleted successfully
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
 *                   example: "Subcategory deleted successfully"
 *       400:
 *         description: Cannot delete subcategory with existing products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Subcategory not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id',
  ...adminWithAudit('DELETE_SUBCATEGORY'),
  deleteSubCategory
);

/**
 * @swagger
 * /api/v1/admin/subcategories/{id}/toggle-status:
 *   patch:
 *     summary: Toggle subcategory status (Admin)
 *     tags: [Admin - SubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: Subcategory ID
 *           example: 1
 *     responses:
 *       200:
 *         description: Subcategory status toggled successfully
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
 *                   example: "Subcategory activated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SubCategory'
 *       404:
 *         description: Subcategory not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id/toggle-status',
  ...adminWithAudit('UPDATE_SUBCATEGORY'),
  toggleSubCategoryStatus
);

module.exports = router;