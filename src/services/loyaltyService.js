const User = require("../models/entities/User");
const ShopSetting = require("../models/entities/ShopSetting");

async function getLoyaltyConfig() {
  console.log("[loyalty] getLoyaltyConfig: start");
  try {
    const row = await ShopSetting.findOne({ where: { key: "loyalty" } });
    console.log("[loyalty] getLoyaltyConfig: row=", row ? row.toJSON() : null);
    const value = row?.value || {
      enabled: false,
      slots: 10,
      stamp_on: "paid",
      reset_on_reward: false,
      rewards: [],
    };
    console.log("[loyalty] getLoyaltyConfig: value=", value);
    return value;
  } catch (e) {
    console.error("[loyalty] getLoyaltyConfig ERROR:", e.message, e.stack);
    throw e;
  }
}

async function addStampForOrder(order) {
  const config = await getLoyaltyConfig();
  if (!config.enabled) return null;
  if (!order.user_id) return null;

  const trigger = config.stamp_on || "paid";
  if (trigger === "paid" && order.payment_status !== "paid") return null;
  if (trigger === "completed" && order.status !== "completed") return null;

  const user = await User.findByPk(order.user_id);
  if (!user || user.role !== "customer") return null;

  const slots = config.slots || 10;
  let stamps = (user.loyalty_stamps || 0) + 1;
  const lifetime = (user.loyalty_total_stamps || 0) + 1;

  if (stamps > slots) {
    stamps = config.reset_on_reward ? 1 : slots;
  }

  await user.update({
    loyalty_stamps: stamps,
    loyalty_total_stamps: lifetime,
  });

  const unlocked = (config.rewards || []).filter((r) => r.at_stamp === stamps);

  return { stamps, slots, unlocked, lifetime };
}

function getClaimedStamps(user) {
  const raw = user.loyalty_claimed_stamps;
  if (Array.isArray(raw)) return raw.map(Number);
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p.map(Number) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Pick and validate a reward the customer can use now.
 * returns { reward, claimed } or throws AppError via caller
 */
function findAvailableReward(user, config, requestedAtStamp) {
  const stamps = user.loyalty_stamps || 0;
  const claimed = getClaimedStamps(user);
  const rewards = config.rewards || [];

  let reward;
  if (requestedAtStamp != null) {
    reward = rewards.find(
      (r) => Number(r.at_stamp) === Number(requestedAtStamp)
    );
  } else {
    // highest unlocked, not yet claimed
    reward = rewards
      .filter(
        (r) => stamps >= r.at_stamp && !claimed.includes(Number(r.at_stamp))
      )
      .sort((a, b) => b.at_stamp - a.at_stamp)[0];
  }

  return { reward, claimed, stamps };
}

async function markRewardClaimed(user, reward, config) {
  const claimed = getClaimedStamps(user);
  const at = Number(reward.at_stamp);
  if (!claimed.includes(at)) claimed.push(at);

  const updates = {
    loyalty_claimed_stamps: claimed,
  };

  if (config.reset_on_reward) {
    updates.loyalty_stamps = 0;
  }

  await user.update(updates);
  return claimed;
}

module.exports = {
  getLoyaltyConfig,
  addStampForOrder,
  getClaimedStamps,
  findAvailableReward,
  markRewardClaimed,
};
