const { isModuleEnabled, getPublicLicense } = require("../config/license");

/** Block API if module is off on this license */
const requireModule = (moduleKey) => (req, res, next) => {
  if (!isModuleEnabled(moduleKey)) {
    return res.status(403).json({
      success: false,
      message: `Module "${moduleKey}" is not available on your current license`,
      license: getPublicLicense(),
    });
  }
  next();
};

/** Block creating staff admins on basic / expired */
const requireCanCreateAdmins = (req, res, next) => {
  const lic = getPublicLicense();
  if (!lic.can_create_admins) {
    return res.status(403).json({
      success: false,
      message: "Creating staff admins requires Pro plan and an active license",
      license: lic,
    });
  }
  next();
};

module.exports = { requireModule, requireCanCreateAdmins };