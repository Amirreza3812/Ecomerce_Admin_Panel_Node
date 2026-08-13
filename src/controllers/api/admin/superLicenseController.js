const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const ShopSetting = require("../../../models/entities/ShopSetting");
const {
  getPublicLicense,
  normalizeLicense,
  fileLicense,
} = require("../../../config/license");

const getLicense = catchAsync(async (req, res) => {
  const license = await getPublicLicense();
  const row = await ShopSetting.findOne({ where: { key: "license" } });

  res.json({
    success: true,
    data: {
      license,
      source: row ? "database" : "file",
      raw_override: row ? row.value : null,
      file_defaults: fileLicense,
    },
  });
});

const updateLicense = catchAsync(async (req, res, next) => {
  const { plan, expires_at, can_create_admins, modules } = req.body;

  if (plan && !["basic", "pro"].includes(plan)) {
    return next(new AppError("plan must be basic or pro", 400));
  }

  let row = await ShopSetting.findOne({ where: { key: "license" } });
  const current = row?.value || {};

  const nextValue = {
    ...current,
    ...(plan !== undefined ? { plan } : {}),
    ...(expires_at !== undefined ? { expires_at } : {}),
    ...(can_create_admins !== undefined ? { can_create_admins } : {}),
    ...(modules !== undefined
      ? { modules: { ...(current.modules || {}), ...modules } }
      : {}),
  };

  const normalized = normalizeLicense({
    ...fileLicense,
    ...nextValue,
    modules: {
      ...fileLicense.modules,
      ...(nextValue.modules || {}),
    },
  });

  // Persist the override fields (not only computed days_left)
  const toStore = {
    plan: normalized.plan,
    expires_at: normalized.expires_at,
    can_create_admins: normalized.can_create_admins,
    modules: normalized.modules,
  };

  if (!row) {
    row = await ShopSetting.create({ key: "license", value: toStore });
  } else {
    await row.update({ value: toStore });
  }

  res.json({
    success: true,
    message: "License updated",
    data: {
      license: await getPublicLicense(),
      source: "database",
    },
  });
});

/** Clear DB override → back to file/env */
const resetLicenseToFile = catchAsync(async (req, res) => {
  const row = await ShopSetting.findOne({ where: { key: "license" } });
  if (row) await row.destroy();

  res.json({
    success: true,
    message: "License override removed; using file/env",
    data: { license: await getPublicLicense(), source: "file" },
  });
});

module.exports = {
  getLicense,
  updateLicense,
  resetLicenseToFile,
};