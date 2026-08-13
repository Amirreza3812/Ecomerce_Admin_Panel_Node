const express = require("express");
const router = express.Router();
const {
  createMyOrder,
  getMyOrders,
  getMyOrder,
  cancelMyOrder,
} = require("../../../controllers/api/v1/orderController");
const { protect, restrictTo } = require("../../../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Customer Orders
 *   description: Customer create and view own orders
 */

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create order (customer)
 *     tags: [Customer Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity]
 *                   properties:
 *                     product_id: { type: integer, example: 1 }
 *                     quantity: { type: integer, example: 2 }
 *                     size: { type: string, example: "Large" }
 *                     notes: { type: string }
 *               order_type:
 *                 type: string
 *                 enum: [dine_in, takeaway, delivery]
 *                 example: takeaway
 *               table_number: { type: string }
 *               notes: { type: string }
 *               payment_method:
 *                 type: string
 *                 enum: [cash, card, digital_wallet, bank_transfer, online]
 *                 example: cash
 *     responses:
 *       201:
 *         description: Order created
 */
router.post("/", protect, restrictTo("customer"), createMyOrder);

/**
 * @swagger
 * /api/v1/orders/me:
 *   get:
 *     summary: List my orders
 *     tags: [Customer Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Orders list
 */
router.get("/me", protect, restrictTo("customer"), getMyOrders);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get one of my orders
 *     tags: [Customer Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Order detail
 *       404:
 *         description: Not found
 */
router.get("/:id", protect, restrictTo("customer"), getMyOrder);

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   patch:
 *     summary: Cancel my pending order
 *     tags: [Customer Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cancelled
 */
router.patch("/:id/cancel", protect, restrictTo("customer"), cancelMyOrder);

module.exports = router;