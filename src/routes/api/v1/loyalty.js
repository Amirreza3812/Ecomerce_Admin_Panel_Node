const express = require("express");
const router = express.Router();
const {
  getMyLoyaltyCard,
  getLoyaltyProgram,
} = require("../../../controllers/api/v1/loyaltyController");
const { protect, restrictTo } = require("../../../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Loyalty
 *   description: Customer loyalty card
 */

/**
 * @swagger
 * /api/v1/loyalty/program:
 *   get:
 *     summary: Public loyalty program rules (no personal progress)
 *     tags: [Loyalty]
 *     responses:
 *       200:
 *         description: Program config if enabled
 */
router.get("/program", getLoyaltyProgram);

/**
 * @swagger
 * /api/v1/loyalty/me:
 *   get:
 *     summary: Get current customer loyalty card
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stamps, slots, rewards with unlocked flags
 *       401:
 *         description: Not logged in
 *       403:
 *         description: Not a customer
 */
router.get("/me", protect, restrictTo("customer"), getMyLoyaltyCard);

module.exports = router;