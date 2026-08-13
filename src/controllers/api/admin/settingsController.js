const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const ShopSetting = require("../../../models/entities/ShopSetting");

const DEFAULTS = {
  loyalty: {
    enabled: false,
    slots: 10,
    stamp_on: "paid",
    reset_on_reward: false,
    rewards: [
      { at_stamp: 3, type: "percent", value: 30, title: "۳۰٪ تخفیف" },
      { at_stamp: 10, type: "percent", value: 50, title: "۵۰٪ تخفیف" },
    ],
  },
  online_offer: {
    enabled: false,
    title: "تخفیف پرداخت آنلاین",
    type: "percent",
    value: 10,
    min_order_amount: 0,
    starts_at: null,
    ends_at: null,
    code: null,
  },
  general: {
    online_payment_enabled: false,
  },
};

async function getOrCreate(key) {
  let row = await ShopSetting.findOne({ where: { key } });
  if (!row) {
    row = await ShopSetting.create({
      key,
      value: DEFAULTS[key] || {},
    });
  }
  return row;
}

const getSettings = catchAsync(async (req, res) => {
  const keys = ["loyalty", "online_offer", "general"];
  const result = {};
  for (const key of keys) {
    const row = await getOrCreate(key);
    result[key] = row.value;
  }
  res.json({ success: true, data: result });
});

const updateSettings = catchAsync(async (req, res, next) => {
  const { loyalty, online_offer, general } = req.body;
  const updated = {};

  if (loyalty !== undefined) {
    if (loyalty.slots != null && (loyalty.slots < 1 || loyalty.slots > 50)) {
      return next(new AppError("slots must be between 1 and 50", 400));
    }
    const slots = loyalty.slots || 10;
    if (Array.isArray(loyalty.rewards)) {
      for (const r of loyalty.rewards) {
        if (!r.at_stamp || r.at_stamp < 1 || r.at_stamp > slots) {
          return next(
            new AppError(`reward at_stamp must be between 1 and ${slots}`, 400)
          );
        }
      }
    }
    const row = await getOrCreate("loyalty");
    const value = { ...DEFAULTS.loyalty, ...loyalty };
    await row.update({ value });
    updated.loyalty = value;
  }

  if (online_offer !== undefined) {
    const row = await getOrCreate("online_offer");
    const value = { ...DEFAULTS.online_offer, ...online_offer };
    await row.update({ value });
    updated.online_offer = value;
  }

  if (general !== undefined) {
    const row = await getOrCreate("general");
    const value = { ...DEFAULTS.general, ...general };
    await row.update({ value });
    updated.general = value;
  }

  res.json({
    success: true,
    message: "Settings updated",
    data: updated,
  });
});

module.exports = { getSettings, updateSettings };
