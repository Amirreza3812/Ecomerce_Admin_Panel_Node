const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateSettings,
} = require("../../controllers/api/admin/settingsController");
const { adminWithAudit } = require("../../middlewares/adminAuth");

/**
 * @swagger
 * tags:
 *   name: Admin - Settings
 *   description: Shop settings (loyalty, online offer, general)
 */

/**
 * @swagger
 * /api/v1/admin/settings:
 *   get:
 *     summary: Get all shop settings
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: loyalty, online_offer, general
 */
router.get("/", ...adminWithAudit("VIEW_SETTINGS"), getSettings);

/**
 * @swagger
 * /api/v1/admin/settings:
 *   patch:
 *     summary: Update shop settings (partial)
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loyalty:
 *                 type: object
 *                 properties:
 *                   enabled: { type: boolean }
 *                   slots: { type: integer, example: 10 }
 *                   stamp_on: { type: string, enum: [paid, completed] }
 *                   reset_on_reward: { type: boolean }
 *                   rewards:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         at_stamp: { type: integer, example: 3 }
 *                         type: { type: string, enum: [percent, fixed, free_item] }
 *                         value: { type: number, example: 30 }
 *                         title: { type: string }
 *               online_offer:
 *                 type: object
 *                 properties:
 *                   enabled: { type: boolean }
 *                   title: { type: string }
 *                   type: { type: string, enum: [percent, fixed] }
 *                   value: { type: number }
 *                   min_order_amount: { type: number }
 *                   starts_at: { type: string, format: date, nullable: true }
 *                   ends_at: { type: string, format: date, nullable: true }
 *                   code: { type: string, nullable: true }
 *               general:
 *                 type: object
 *                 properties:
 *                   online_payment_enabled: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated keys
 */
router.patch("/", ...adminWithAudit("MANAGE_SETTINGS"), updateSettings);

module.exports = router;
