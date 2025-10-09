const express = require("express");
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardOverview:
 *       type: object
 *       properties:
 *         newCustomers:
 *           type: object
 *           properties:
 *             value:
 *               type: integer
 *               example: 45
 *             change:
 *               type: integer
 *               example: 12
 *         totalOrders:
 *           type: object
 *           properties:
 *             value:
 *               type: integer
 *               example: 156
 *             change:
 *               type: integer
 *               example: 8
 *         totalRevenue:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               example: 2847.50
 *             change:
 *               type: integer
 *               example: 15
 *         activeProducts:
 *           type: object
 *           properties:
 *             value:
 *               type: integer
 *               example: 32
 *             change:
 *               type: integer
 *               example: 0
 *         averageOrderValue:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               example: 18.25
 *             change:
 *               type: integer
 *               example: 5
 *     RecentActivity:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [order, customer, comment]
 *           example: order
 *         id:
 *           type: integer
 *           example: 123
 *         title:
 *           type: string
 *           example: New Order #123
 *         description:
 *           type: string
 *           example: John Doe placed an order worth $25.50
 *         status:
 *           type: string
 *           example: pending
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: 2023-10-06T16:47:26.204Z
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 456
 *             name:
 *               type: string
 *               example: John Doe
 *             email:
 *               type: string
 *               example: john.doe@example.com
 *     SalesChartData:
 *       type: object
 *       properties:
 *         period:
 *           type: string
 *           example: week
 *         chartData:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               period:
 *                 type: string
 *                 example: 2023-10-01
 *               orders:
 *                 type: integer
 *                 example: 25
 *               revenue:
 *                 type: number
 *                 example: 450.75
 *     TopProduct:
 *       type: object
 *       properties:
 *         product:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 789
 *             name:
 *               type: string
 *               example: Cappuccino
 *             price:
 *               type: number
 *               example: 4.50
 *             image:
 *               type: string
 *               example: https://example.com/images/cappuccino.jpg
 *         totalQuantity:
 *           type: integer
 *           example: 150
 *         totalRevenue:
 *           type: number
 *           example: 675.00
 *         orderCount:
 *           type: integer
 *           example: 120
 *     OrderStatusDistribution:
 *       type: object
 *       example:
 *         pending: 25
 *         confirmed: 40
 *         preparing: 15
 *         ready: 10
 *         completed: 150
 *         cancelled: 5
 *     RecentOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 123
 *         orderNumber:
 *           type: string
 *           example: ORD-20231006-001
 *         customerName:
 *           type: string
 *           example: John Doe
 *         customerEmail:
 *           type: string
 *           example: john.doe@example.com
 *         totalAmount:
 *           type: number
 *           example: 25.50
 *         status:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, completed, cancelled]
 *           example: pending
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2023-10-06T16:47:26.204Z
 *     SessionsData:
 *       type: object
 *       properties:
 *         period:
 *           type: string
 *           example: week
 *         chartData:
 *           type: object
 *           properties:
 *             direct:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [300, 900, 600, 1200, 1500, 1800, 2400, 2100, 2700, 3000]
 *             referral:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [500, 900, 700, 1400, 1100, 1700, 2300, 2000, 2600, 2900]
 *             organic:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [1000, 1500, 1200, 1700, 1300, 2000, 2400, 2200, 2600, 2800]
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
const {
  getDashboardOverview,
  getRecentActivities,
  getSalesChart,
  getTopProducts,
  getOrderStatusDistribution,
  getRecentOrders,
  getSessionsData,
} = require("../../controllers/api/admin/dashboardController");

const { adminWithAudit } = require("../../middlewares/adminAuth");

// Dashboard Routes

/**
 * @swagger
 * /api/v1/admin/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview statistics (Admin)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardOverview'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/overview",
  ...adminWithAudit("VIEW_DASHBOARD_OVERVIEW"),
  getDashboardOverview
);

/**
 * @swagger
 * /api/v1/admin/dashboard/activities:
 *   get:
 *     summary: Get recent activities (Admin)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of activities to return
 *     responses:
 *       200:
 *         description: Recent activities retrieved successfully
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
 *                     $ref: '#/components/schemas/RecentActivity'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/activities",
  ...adminWithAudit("VIEW_RECENT_ACTIVITIES"),
  getRecentActivities
);

/**
 * @swagger
 * /api/v1/admin/dashboard/sales-chart:
 *   get:
 *     summary: Get sales chart data (Admin)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: week
 *         description: Time period for sales data
 *     responses:
 *       200:
 *         description: Sales chart data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalesChartData'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/sales-chart",
  ...adminWithAudit("VIEW_SALES_CHART"),
  getSalesChart
);

/**
 * @swagger
 * /api/v1/admin/dashboard/top-products:
 *   get:
 *     summary: Get top selling products (Admin)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *         description: Time period for top products data
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of products to return
 *     responses:
 *       200:
 *         description: Top products data retrieved successfully
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
 *                     $ref: '#/components/schemas/TopProduct'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/top-products",
  ...adminWithAudit("VIEW_TOP_PRODUCTS"),
  getTopProducts
);

/**
 * @swagger
 * /api/v1/admin/dashboard/order-status:
 *   get:
 *     summary: Get order status distribution (Admin)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *         description: Time period for order status data
 *     responses:
 *       200:
 *         description: Order status distribution retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/OrderStatusDistribution'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/order-status",
  ...adminWithAudit("VIEW_ORDER_STATUS_DISTRIBUTION"),
  getOrderStatusDistribution
);

/**
 * @swagger
 * /api/v1/admin/dashboard/recent-orders:
 *   get:
 *     summary: Get recent orders (Admin)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of orders to return
 *     responses:
 *       200:
 *         description: Recent orders retrieved successfully
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
 *                     $ref: '#/components/schemas/RecentOrder'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/recent-orders",
  ...adminWithAudit("VIEW_RECENT_ORDERS"),
  getRecentOrders
);

/**
 * @swagger
 * /api/v1/admin/dashboard/sessions:
 *   get:
 *     summary: Get sessions data (Admin)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: week
 *         description: Time period for sessions data
 *     responses:
 *       200:
 *         description: Sessions data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SessionsData'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/sessions",
  ...adminWithAudit("VIEW_SESSIONS_DATA"),
  getSessionsData
);

module.exports = router;