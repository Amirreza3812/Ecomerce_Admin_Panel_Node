const express = require("express");
const router = express.Router();
const {
  getAllWorkers,
  getWorker,
  createWorker,
  updateWorker,
  deleteWorker,
  getWorkerStats,
} = require("../../controllers/api/admin/workerController");
const { adminWithAudit } = require("../../middlewares/adminAuth");

/**
 * @swagger
 * tags:
 *   name: Admin - Workers
 *   description: Worker / personnel management
 */

/**
 * @swagger
 * /api/v1/admin/workers/stats/summary:
 *   get:
 *     summary: Get worker statistics
 *     tags: [Admin - Workers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved
 */
router.get(
  "/stats/summary",
  ...adminWithAudit("VIEW_WORKERS"),
  getWorkerStats
);

/**
 * @swagger
 * /api/v1/admin/workers:
 *   get:
 *     summary: List workers
 *     tags: [Admin - Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Workers list
 */
router.get("/", ...adminWithAudit("VIEW_WORKERS"), getAllWorkers);

/**
 * @swagger
 * /api/v1/admin/workers/{id}:
 *   get:
 *     summary: Get worker by ID
 *     tags: [Admin - Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Worker details
 *       404:
 *         description: Not found
 */
router.get("/:id", ...adminWithAudit("VIEW_WORKERS"), getWorker);

/**
 * @swagger
 * /api/v1/admin/workers:
 *   post:
 *     summary: Create worker
 *     tags: [Admin - Workers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "علی رضایی" }
 *               phone: { type: string, example: "09121234567" }
 *               email: { type: string }
 *               job_title: { type: string, example: "barista" }
 *               hire_date: { type: string, format: date }
 *               base_salary: { type: number, example: 15000000 }
 *               status: { type: string, enum: [active, inactive] }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/", ...adminWithAudit("MANAGE_WORKERS"), createWorker);

/**
 * @swagger
 * /api/v1/admin/workers/{id}:
 *   patch:
 *     summary: Update worker
 *     tags: [Admin - Workers]
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
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               job_title: { type: string }
 *               hire_date: { type: string, format: date }
 *               base_salary: { type: number }
 *               status: { type: string, enum: [active, inactive] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch("/:id", ...adminWithAudit("MANAGE_WORKERS"), updateWorker);

/**
 * @swagger
 * /api/v1/admin/workers/{id}:
 *   delete:
 *     summary: Deactivate worker (soft delete)
 *     tags: [Admin - Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deactivated
 */
router.delete("/:id", ...adminWithAudit("MANAGE_WORKERS"), deleteWorker);

module.exports = router;