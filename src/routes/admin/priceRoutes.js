const express = require("express");
const router = express.Router();
const {
  increaseAllPrices,
  applyDiscountToAll,
  setBulkPrices,
  getPriceAnalytics,
  restoreOriginalPrices,
  restoreExpiredSales,
} = require("../../controllers/api/admin/priceController");

const { adminWithAudit } = require("../../middlewares/adminAuth");

const {
  validatePriceRestore,
  validateBulkPrices,
  validateAnalyticsQuery,
  validatePriceIncrease,
  validatePriceDiscount,
} = require("../../middlewares/validation");

/**
 * @swagger
 * /api/v1/admin/prices/increase:
 *   patch:
 *     summary: Increase prices by percentage
 *     tags: [Admin - Price Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - percentage
 *             properties:
 *               percentage:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 100
 *                 description: Percentage to increase prices
 *                 example: 10
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Apply only to specific category
 *               subcategoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Apply only to specific subcategory
 *     responses:
 *       200:
 *         description: Prices increased successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: No products found
 */
router.patch(
  "/increase",
  ...adminWithAudit("INCREASE_PRICES"),
  validatePriceIncrease,
  increaseAllPrices
);

/**
 * @swagger
 * /api/v1/admin/prices/discount:
 *   patch:
 *     summary: Apply discount by percentage with automatic date calculation
 *     tags: [Admin - Price Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - percentage
 *               - duration
 *             properties:
 *               percentage:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 99.99
 *                 description: Discount percentage to apply
 *                 example: 15
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *                 description: Duration in days for the discount
 *                 example: 7
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Apply only to specific category
 *               subcategoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Apply only to specific subcategory
 *     responses:
 *       200:
 *         description: Discount applied successfully
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
 *                   example: "Successfully applied 15% discount for 7 days to 10 products"
 *                 data:
 *                   type: object
 *                   properties:
 *                     productsUpdated:
 *                       type: integer
 *                       example: 10
 *                     percentage:
 *                       type: number
 *                       example: 15
 *                     duration:
 *                       type: integer
 *                       example: 7
 *                     salePeriod:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date
 *                           example: "2025-07-15"
 *                         endDate:
 *                           type: string
 *                           format: date
 *                           example: "2025-07-22"
 *                         durationDays:
 *                           type: integer
 *                           example: 7
 *       400:
 *         description: Invalid input
 *       404:
 *         description: No products found
 */
router.patch(
  "/discount",
  ...adminWithAudit("APPLY_DISCOUNT"),
  validatePriceDiscount,
  applyDiscountToAll
);

/**
 * @swagger
 * /api/v1/admin/prices/set-bulk:
 *   patch:
 *     summary: Set specific prices for multiple products
 *     tags: [Admin - Price Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - price
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       minimum: 1
 *                       example: 1
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       example: 12.99
 *     responses:
 *       200:
 *         description: Bulk prices updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Some products not found
 */
router.patch(
  "/set-bulk",
  ...adminWithAudit("BULK_PRICE_UPDATE"),
  validateBulkPrices,
  setBulkPrices
);

/**
 * @swagger
 * /api/v1/admin/prices/analytics:
 *   get:
 *     summary: Get price analytics and statistics
 *     tags: [Admin - Price Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by category ID
 *       - in: query
 *         name: subcategoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by subcategory ID
 *     responses:
 *       200:
 *         description: Price analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalProducts:
 *                           type: integer
 *                         minPrice:
 *                           type: number
 *                         maxPrice:
 *                           type: number
 *                         avgPrice:
 *                           type: number
 *                     priceRanges:
 *                       type: object
 *                     categoryStats:
 *                       type: object
 *       400:
 *         description: Invalid query parameters
 */
router.get(
  "/analytics",
  ...adminWithAudit("VIEW_PRICE_ANALYTICS"),
  validateAnalyticsQuery,
  getPriceAnalytics
);

/**
 * @swagger
 * /api/v1/admin/prices/restore:
 *   patch:
 *     summary: Restore original prices for products
 *     tags: [Admin - Price Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Apply only to specific category
 *               subcategoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Apply only to specific subcategory
 *     responses:
 *       200:
 *         description: Original prices restored successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: No products found with original prices to restore
 */
router.patch(
  "/restore",
  ...adminWithAudit("RESTORE_PRICES"),
  validatePriceRestore,
  restoreOriginalPrices
);

/**
 * @swagger
 * /api/v1/admin/prices/restore-expired:
 *   patch:
 *     summary: Restore prices for products with expired sales
 *     tags: [Admin - Price Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prices restored for expired sales successfully
 *       404:
 *         description: No products with expired sales found
 */
router.patch(
  "/restore-expired",
  ...adminWithAudit("RESTORE_EXPIRED_PRICES"),
  restoreExpiredSales
);

module.exports = router;
