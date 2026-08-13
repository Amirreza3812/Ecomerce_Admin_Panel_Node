const { getPublicLicense } = require("../config/license");

/** Block API if module is off on this license */
const requireModule = (moduleKey) => async (req, res, next) => {
  try {
    const lic = await getPublicLicense();
    if (lic.expired || !lic.modules[moduleKey]) {
      return res.status(403).json({
        success: false,
        message: `Module "${moduleKey}" is not available on your current license`,
        license: lic,
      });
    }
    next();
  } catch (e) {
    next(e);
  }
};
/** Block creating staff admins on basic / expired */
const requireCanCreateAdmins = async (req, res, next) => {
  try {
    const lic = await getPublicLicense();
    if (!lic.can_create_admins) {
      return res.status(403).json({
        success: false,
        message: "ساخت مدیر فقط با پلن پرو و لایسنس فعال مجاز است",
        license: lic,
      });
    }
    next();
  } catch (e) {
    next(e);
  }
};
/** Owner (or super_admin) only */
const requireOwner = (req, res, next) => {
  const u = req.user;
  if (!u) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (u.role === "super_admin") return next();
  if (
    u.role === "admin" &&
    (u.staff_role === "owner" || u.staff_role == null)
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "فقط مالک فروشگاه می‌تواند مدیران را مدیریت کند",
  });
};

module.exports = {
  requireModule,
  requireCanCreateAdmins,
  requireOwner,
};
