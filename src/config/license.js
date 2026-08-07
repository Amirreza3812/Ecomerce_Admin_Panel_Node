/**
 * OFFLINE license stub.
 * Change values here (or via .env) — no remote license server.
 */
const licenseConfig = {
  plan: process.env.LICENSE_PLAN || "pro", // "basic" | "pro"
  expires_at: process.env.LICENSE_EXPIRES || "2026-12-31",
  // basic → false; pro → true
  can_create_admins:
    process.env.LICENSE_CAN_CREATE_ADMINS !== undefined
      ? process.env.LICENSE_CAN_CREATE_ADMINS === "true"
      : (process.env.LICENSE_PLAN || "pro") === "pro",

  modules: {
    orders: true,
    categories: true,
    products: true,
    subcategories: true,
    prices: true,
    customers: process.env.LICENSE_PLAN === "basic" ? false : true,
    banking: process.env.LICENSE_PLAN === "basic" ? false : true,
    personnel: process.env.LICENSE_PLAN === "basic" ? false : true,
    comments: true,
    settings: true,
    about: true,
    feedback: true,
    myAccount: true,
    online_payment_enabled: false, // owner toggle later
  },
};

// Override individual modules via env if you want, e.g. LICENSE_MODULE_BANKING=false

function getDaysLeft() {
  const end = new Date(licenseConfig.expires_at);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isExpired() {
  return getDaysLeft() < 0;
}

function getPublicLicense() {
  const days_left = getDaysLeft();
  return {
    plan: licenseConfig.plan,
    expires_at: licenseConfig.expires_at,
    days_left,
    expired: days_left < 0,
    can_create_admins: licenseConfig.can_create_admins && days_left >= 0,
    modules: { ...licenseConfig.modules },
  };
}

function isModuleEnabled(key) {
  if (isExpired()) return false;
  return !!licenseConfig.modules[key];
}

module.exports = {
  licenseConfig,
  getDaysLeft,
  isExpired,
  getPublicLicense,
  isModuleEnabled,
};
