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

const fileLicense = {
  plan: process.env.LICENSE_PLAN || "pro",
  expires_at: process.env.LICENSE_EXPIRES || "2026-12-31",
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
    customers: true,
    banking: true,
    personnel: true,
    comments: true,
    settings: true,
    about: true,
    feedback: true,
    myAccount: true,
  },
};

// Override individual modules via env if you want, e.g. LICENSE_MODULE_BANKING=false

function daysLeft(expires_at) {
  const end = new Date(expires_at);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// function isExpired() {
//   return getDaysLeft() < 0;
// }

function normalizeLicense(partial = {}) {
  const modules = {
    ...fileLicense.modules,
    ...(partial.modules || {}),
  };
  const expires_at = partial.expires_at || fileLicense.expires_at;
  const d = daysLeft(expires_at);
  const plan = partial.plan || fileLicense.plan;
  const can_create_admins =
    partial.can_create_admins !== undefined
      ? !!partial.can_create_admins
      : plan === "pro";

  return {
    plan,
    expires_at,
    days_left: d,
    expired: d < 0,
    can_create_admins: can_create_admins && d >= 0,
    modules,
  };
}

function getPublicLicenseSync() {
  return normalizeLicense(fileLicense);
}

async function getPublicLicense() {
  try {
    const ShopSetting = require("../models/entities/ShopSetting");
    const row = await ShopSetting.findOne({ where: { key: "license" } });
    if (row && row.value && typeof row.value === "object") {
      return normalizeLicense({
        ...fileLicense,
        ...row.value,
        modules: { ...fileLicense.modules, ...(row.value.modules || {}) },
      });
    }
  } catch (e) {
    // table missing / first boot → fall back
    console.warn("[license] DB read failed, using file:", e.message);
  }
  return normalizeLicense(fileLicense);
}

function isModuleEnabledSync(key) {
  const lic = getPublicLicenseSync();
  if (lic.expired) return false;
  return !!lic.modules[key];
}

async function isModuleEnabled(key) {
  const lic = await getPublicLicense();
  if (lic.expired) return false;
  return !!lic.modules[key];
}

module.exports = {
  licenseConfig,
  fileLicense,
  normalizeLicense,
  getPublicLicenseSync,
  getPublicLicense,
  isModuleEnabledSync,
  isModuleEnabled,
  // backward compat if old code used these names:
  licenseConfig: fileLicense,
  getDaysLeft: () => daysLeft(fileLicense.expires_at),
  isExpired: () => daysLeft(fileLicense.expires_at) < 0,
};
