const express = require("express");
const router = express.Router();
const {
  listStaff,
  getStaff,
  createStaff,
  updateStaff,
  updateStaffPassword,
  deactivateStaff,
} = require("../../controllers/api/admin/staffController");
const {
  requireCanCreateAdmins,
  requireOwner,
} = require("../../middlewares/license");
const { adminWithAudit } = require("../../middlewares/adminAuth");

// Use the same admin auth pattern as your other admin routes:
// e.g. router.use(protectAdmin) OR spread adminWithAudit on each line.
// Adjust import names to match your project.

/**
 * @swagger
 * tags:
 *   name: Admin - Staff
 *   description: Staff admins (Pro plan only)
 */

/**
 * @swagger
 * /api/v1/admin/staff:
 *   get:
 *     summary: List staff admins
 *     tags: [Admin - Staff]
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
 *         schema: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Staff list
 *       403:
 *         description: Not Pro / not owner
 */
router.get(
  "/",
  ...adminWithAudit("VIEW_STAFF"),
  requireOwner,
  requireCanCreateAdmins,
  listStaff
);

/**
 * @swagger
 * /api/v1/admin/staff:
 *   post:
 *     summary: Create staff admin
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, staff_role]
 *             properties:
 *               name: { type: string, example: "Ali" }
 *               email: { type: string, example: "barista@cafe.com" }
 *               password: { type: string, example: "secret12" }
 *               phone: { type: string }
 *               staff_role:
 *                 type: string
 *                 enum: [manager, barista, cashier, accountant, custom]
 *               permissions:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  ...adminWithAudit("VIEW_STAFF"),
  requireOwner,
  requireCanCreateAdmins,
  createStaff
);

/**
 * @swagger
 * /api/v1/admin/staff/{id}:
 *   get:
 *     summary: Get one staff
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Staff
 */
router.get(
  "/:id",
  ...adminWithAudit("VIEW_STAFF"),
  requireOwner,
  requireCanCreateAdmins,
  getStaff
);

/**
 * @swagger
 * /api/v1/admin/staff/{id}:
 *   patch:
 *     summary: Update staff
 *     tags: [Admin - Staff]
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
 *               staff_role: { type: string }
 *               permissions: { type: array, items: { type: string } }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  "/:id",
  ...adminWithAudit("VIEW_STAFF"),
  requireOwner,
  requireCanCreateAdmins,
  updateStaff
);

/**
 * @swagger
 * /api/v1/admin/staff/{id}/password:
 *   patch:
 *     summary: Reset staff password
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Password updated
 */
router.patch(
  "/:id/password",
  ...adminWithAudit("VIEW_STAFF"),
  requireOwner,
  requireCanCreateAdmins,
  updateStaffPassword
);

/**
 * @swagger
 * /api/v1/admin/staff/{id}/deactivate:
 *   patch:
 *     summary: Deactivate staff
 *     tags: [Admin - Staff]
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
router.patch(
  "/:id/deactivate",
  ...adminWithAudit("VIEW_STAFF"),
  requireOwner,
  requireCanCreateAdmins,
  deactivateStaff
);

module.exports = router;
