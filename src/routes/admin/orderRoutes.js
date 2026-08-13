const express = require("express");
const router = express.Router();
const {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  getOrderStats,
  getMonthlySalesReport,
  updateOrderPayment,
} = require("../../controllers/api/admin/orderController");

const { adminWithAudit } = require("../../middlewares/adminAuth");
const { body, validationResult } = require("express-validator");

// Status validation middleware
const validateOrderStatus = [
  body("status")
    .notEmpty()
    .isIn([
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ])
    .withMessage("Invalid order status"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Routes

/**
 * @swagger
 * /api/v1/admin/orders:
 *   get:
 *     summary: Get all orders with filtering (Admin)
 *     tags: [Admin - Orders]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, preparing, ready, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders to date
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *         description: Search by customer name or email
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           total:
 *                             type: number
 *                           status:
 *                             type: string
 *                           order_date:
 *                             type: string
 *                             format: date-time
 *                           orderItems:
 *                             type: array
 *                             items:
 *                               type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get("/", ...adminWithAudit("VIEW_ORDERS"), getAllOrders);

router.get("/stats", ...adminWithAudit("VIEW_ORDER_STATS"), getOrderStats);

/**
 * @swagger
 * /api/v1/admin/orders/reports/monthly:
 *   get:
 *     summary: Get monthly sales report (Admin)
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2024
 *         description: Year for the report
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 3
 *         description: Month for the report (optional, if not provided returns full year)
 *     responses:
 *       200:
 *         description: Monthly sales report retrieved successfully
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
 *                     period:
 *                       type: string
 *                       example: "2024-03"
 *                     totalOrders:
 *                       type: integer
 *                       example: 156
 *                     totalRevenue:
 *                       type: number
 *                       example: 2847.50
 *                     averageOrderValue:
 *                       type: number
 *                       example: 18.25
 *                     topProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Cappuccino"
 *                           quantity:
 *                             type: integer
 *                             example: 45
 *                           revenue:
 *                             type: number
 *                             example: 202.50
 *                     dailyBreakdown:
 *                       type: object
 *                       example:
 *                         "2024-03-01":
 *                           orders: 8
 *                           revenue: 142.50
 *                         "2024-03-02":
 *                           orders: 12
 *                           revenue: 218.75
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  "/reports/monthly",
  ...adminWithAudit("VIEW_MONTHLY_SALES_REPORT"),
  getMonthlySalesReport
);

/**
 * @swagger
 * /api/v1/admin/orders/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     description: Returns full order details including items and customer info.
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
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
 *                   example: Order retrieved successfully
 *                 data:
 *                   type: object
 *                   description: Order object with items
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.get("/:id", ...adminWithAudit("VIEW_ORDER"), getOrder);

/**
 * @swagger
 * /api/v1/admin/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     description: |
 *       Updates the workflow status of an order
 *       (pending, confirmed, preparing, ready, completed, cancelled).
 *       When status becomes completed, completed_at may be set.
 *       If payment_status is paid, an income ledger entry may be created.
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - confirmed
 *                   - preparing
 *                   - ready
 *                   - completed
 *                   - cancelled
 *                 example: preparing
 *     responses:
 *       200:
 *         description: Order status updated successfully
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
 *                   example: Order status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12
 *                     status:
 *                       type: string
 *                       example: preparing
 *                     payment_status:
 *                       type: string
 *                       example: pending
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.patch(
  "/:id/status",
  ...adminWithAudit("UPDATE_ORDER_STATUS"),
  validateOrderStatus,
  updateOrderStatus
);

/**
 * @swagger
 * /api/v1/admin/orders/{id}/payment:
 *   patch:
 *     summary: Update order payment status and method
 *     description: |
 *       Updates payment_status and/or payment_method.
 *       When payment_status is set to paid, an income row is created
 *       in the accounting ledger (expenses table, type=income) if not already present.
 *       online is allowed as payment_method for future online gateway support.
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_status:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - paid
 *                   - failed
 *                   - refunded
 *                 example: paid
 *               payment_method:
 *                 type: string
 *                 enum:
 *                   - cash
 *                   - card
 *                   - digital_wallet
 *                   - bank_transfer
 *                   - online
 *                 example: cash
 *             description: At least one of payment_status or payment_method should be provided
 *           examples:
 *             markPaid:
 *               summary: Mark as paid (cash)
 *               value:
 *                 payment_status: paid
 *                 payment_method: cash
 *             onlinePaid:
 *               summary: Mark as paid (online — future gateway)
 *               value:
 *                 payment_status: paid
 *                 payment_method: online
 *     responses:
 *       200:
 *         description: Payment updated successfully
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
 *                   example: Payment updated
 *                 data:
 *                   type: object
 *                   description: Updated order
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.patch(
  "/:id/payment",
  ...adminWithAudit("UPDATE_ORDER_PAYMENT"),
  updateOrderPayment
);

module.exports = router;
