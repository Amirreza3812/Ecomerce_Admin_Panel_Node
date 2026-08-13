const ROLE_PRESETS = {
  manager: [
    "orders.view",
    "orders.manage",
    "products.view",
    "products.manage",
    "categories.manage",
    "customers.view",
    "comments.moderate",
  ],
  barista: ["orders.view", "orders.manage", "products.view"],
  cashier: ["orders.view", "orders.manage", "products.view"],
  accountant: ["banking.view", "banking.manage", "orders.view"],
  custom: [],
};

const STAFF_ROLES = ["manager", "barista", "cashier", "accountant", "custom"];

module.exports = { ROLE_PRESETS, STAFF_ROLES };
