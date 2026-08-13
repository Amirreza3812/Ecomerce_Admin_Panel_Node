const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const User = require("../../../models/entities/User");
const ShopSetting = require("../../../models/entities/ShopSetting");
const {
  getLoyaltyConfig,
  getClaimedStamps,
} = require("../../../services/loyaltyService");

// async function getLoyaltyConfig() {
//   const row = await ShopSetting.findOne({ where: { key: "loyalty" } });
//   return (
//     row?.value || {
//       enabled: false,
//       slots: 10,
//       stamp_on: "paid",
//       reset_on_reward: false,
//       rewards: [],
//     }
//   );
// }

/**
 * GET /api/v1/loyalty/me
 * Customer: see own loyalty card (stamps, slots, rewards)
 */
const getMyLoyaltyCard = catchAsync(async (req, res, next) => {
  const config = await getLoyaltyConfig();

  if (!config.enabled) {
    return res.json({
      success: true,
      data: {
        enabled: false,
        stamps: 0,
        slots: 0,
        lifetime_stamps: 0,
        progress_percent: 0,
        rewards: [],
        message: "باشگاه مشتریان فعلاً غیرفعال است",
      },
    });
  }

  const user = await User.findByPk(req.user.id, {
    attributes: [
      "id",
      "name",
      "role",
      "loyalty_stamps",
      "loyalty_total_stamps",
    ],
  });

  if (!user || user.role !== "customer") {
    return next(new AppError("فقط مشتریان به کارت وفاداری دسترسی دارند", 403));
  }

  const stamps = user.loyalty_stamps || 0;
  const slots = config.slots || 10;
  const claimed = getClaimedStamps(user);

  const rewards = (config.rewards || []).map((r) => {
    const at = Number(r.at_stamp);
    const unlocked = stamps >= at;
    const isClaimed = claimed.includes(at);
    return {
      at_stamp: at,
      type: r.type,
      value: r.value,
      title: r.title || "",
      product_id: r.product_id ?? null,
      unlocked,
      claimed: isClaimed,
      available: unlocked && !isClaimed, // can use on next order
    };
  });

  const availableRewards = rewards.filter((r) => r.available);

  res.json({
    success: true,
    data: {
      enabled: true,
      stamps,
      slots,
      lifetime_stamps: user.loyalty_total_stamps || 0,
      progress_percent: Math.min(100, Math.round((stamps / slots) * 100)),
      claimed_stamps: claimed,
      available_rewards: availableRewards,
      next_reward: rewards.find((r) => !r.unlocked) || null,
      rewards,
      stamp_on: config.stamp_on || "paid",
    },
  });
});

/**
 * GET /api/v1/loyalty/program
 * Public (optional auth): show program rules without personal stamps
 * Useful for marketing page "how the card works"
 */
const getLoyaltyProgram = catchAsync(async (req, res) => {
  const config = await getLoyaltyConfig();

  if (!config.enabled) {
    return res.json({
      success: true,
      data: { enabled: false, slots: 0, rewards: [] },
    });
  }

  res.json({
    success: true,
    data: {
      enabled: true,
      slots: config.slots || 10,
      stamp_on: config.stamp_on || "paid",
      rewards: (config.rewards || []).map((r) => ({
        at_stamp: r.at_stamp,
        type: r.type,
        value: r.value,
        title: r.title || "",
      })),
    },
  });
});

module.exports = {
  getMyLoyaltyCard,
  getLoyaltyProgram,
};
