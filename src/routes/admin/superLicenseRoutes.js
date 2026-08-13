const express = require("express");
const router = express.Router();
const {
  getLicense,
  updateLicense,
  resetLicenseToFile,
} = require("../../controllers/api/admin/superLicenseController");
const { adminWithAudit } = require("../../middlewares/adminAuth"); // adjust path

/** Only super_admin */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Super admin only",
    });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Super Admin - License
 *   description: Override offline license (super_admin only)
 */

/**
 * @swagger
 * /api/v1/admin/super/license:
 *   get:
 *     summary: Get effective license + source
 *     tags: [Super Admin - License]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: license, source file|database
 */
router.get(
  "/license",
  ...adminWithAudit("VIEW_LICENSE"),
  requireSuperAdmin,
  getLicense
);

/**
 * @swagger
 * /api/v1/admin/super/license:
 *   patch:
 *     summary: Set license override in database
 *     tags: [Super Admin - License]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan: { type: string, enum: [basic, pro] }
 *               expires_at: { type: string, example: "2027-12-31" }
 *               can_create_admins: { type: boolean }
 *               modules:
 *                 type: object
 *                 additionalProperties: { type: boolean }
 *                 example:
 *                   customers: false
 *                   banking: false
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch(
  "/license",
  ...adminWithAudit("MANAGE_LICENSE"),
  requireSuperAdmin,
  updateLicense
);

/**
 * @swagger
 * /api/v1/admin/super/license/reset:
 *   post:
 *     summary: Remove DB override (use file/env again)
 *     tags: [Super Admin - License]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reset
 */
router.post(
  "/license/reset",
  ...adminWithAudit("MANAGE_LICENSE"),
  requireSuperAdmin,
  resetLicenseToFile
);

module.exports = router;