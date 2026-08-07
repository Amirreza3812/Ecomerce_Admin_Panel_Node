const express = require("express");
const router = express.Router();
const { upload } = require("../../middlewares/upload"); // same as products
const {
  getAllExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  markExpensePaid,
} = require("../../controllers/api/admin/expenseController");
const { adminWithAudit } = require("../../middlewares/adminAuth");

/**
 * @swagger
 * tags:
 *   name: Admin - Accounting
 *   description: Expense / bookkeeping
 */

/**
 * @swagger
 * /api/v1/admin/expenses/stats:
 *   get:
 *     summary: Expense totals (optional from/to)
 *     tags: [Admin - Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Stats
 */
router.get("/stats", ...adminWithAudit("VIEW_EXPENSES"), getExpenseStats);

/**
 * @swagger
 * /api/v1/admin/expenses:
 *   get:
 *     summary: List expenses
 *     tags: [Admin - Accounting]
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
 *         name: worker_id
 *         schema: { type: integer }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: payment_method
 *         schema: { type: string, enum: [cash, card, bank, worker_paid] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List
 */
router.get("/", ...adminWithAudit("VIEW_EXPENSES"), getAllExpenses);

/**
 * @swagger
 * /api/v1/admin/expenses/{id}:
 *   get:
 *     summary: Get one expense
 *     tags: [Admin - Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Expense
 */
router.get("/:id", ...adminWithAudit("VIEW_EXPENSES"), getExpense);

/**
 * @swagger
 * /api/v1/admin/expenses:
 *   post:
 *     summary: Record expense (e.g. worker bought milk)
 *     tags: [Admin - Accounting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, expense_date]
 *             properties:
 *               worker_id: { type: integer, nullable: true, example: 1 }
 *               amount: { type: number, example: 250000 }
 *               category: { type: string, example: "milk" }
 *               description: { type: string, example: "شیر برای کافی‌شاپ" }
 *               expense_date: { type: string, format: date, example: "2026-08-06" }
 *               payment_method:
 *                 type: string
 *                 enum: [cash, card, bank, worker_paid]
 *                 example: worker_paid
 *               payment_status:
 *                 type: string
 *                 enum: [paid, unpaid]
 *                 example: unpaid
 *                 description: Whether the bill is settled
 *               receipt_url: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  ...adminWithAudit("MANAGE_EXPENSES"),
  upload.single("receipt"), // field name: receipt
  createExpense
);

/**
 * @swagger
 * /api/v1/admin/expenses/{id}:
 *   patch:
 *     summary: Update expense
 *     tags: [Admin - Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               worker_id: { type: integer, nullable: true }
 *               amount: { type: number }
 *               category: { type: string }
 *               description: { type: string }
 *               expense_date: { type: string, format: date }
 *               payment_method: { type: string }
 *               payment_status: {type: string,enum: [paid, unpaid],  example: unpaid, description: Whether the bill is settled}
 *               receipt_url: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  "/:id",
  ...adminWithAudit("MANAGE_EXPENSES"),
  upload.single("receipt"),
  updateExpense
);

/**
 * @swagger
 * /api/v1/admin/expenses/{id}:
 *   delete:
 *     summary: Delete expense
 *     tags: [Admin - Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete("/:id", ...adminWithAudit("MANAGE_EXPENSES"), deleteExpense);

/**
 * @swagger
 * /api/v1/admin/expenses/{id}/mark-paid:
 *   patch:
 *     summary: Mark expense as paid
 *     tags: [Admin - Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Marked paid
 */
router.patch(
  "/:id/mark-paid",
  ...adminWithAudit("MANAGE_EXPENSES"),
  markExpensePaid
);

module.exports = router;
