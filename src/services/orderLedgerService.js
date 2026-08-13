const Expense = require("../models/entities/Expense");
const { Op } = require("sequelize");

/**
 * Create ledger income for a paid order (idempotent).
 */
async function ensureOrderIncome(order, options = {}) {
  if (!order || order.payment_status !== "paid") {
    return null;
  }

  const existing = await Expense.findOne({
    where: { order_id: order.id, type: "income" },
  });
  if (existing) return existing;

  const amount = parseFloat(order.final_amount || order.total_amount || 0);
  if (amount <= 0) return null;

  const dateSource =
    order.completed_at || order.updatedAt || order.createdAt || new Date();
  const expense_date =
    dateSource instanceof Date
      ? dateSource.toISOString().slice(0, 10)
      : String(dateSource).slice(0, 10);

  return Expense.create(
    {
      type: "income",
      order_id: order.id,
      worker_id: null,
      amount,
      category: "sales",
      description: `فروش سفارش ${order.order_number || order.id}`,
      expense_date,
      payment_method: mapOrderPaymentMethod(order.payment_method),
      payment_status: "paid",
      receipt_url: null,
      created_by: options.created_by || null,
    },
    { transaction: options.transaction }
  );
}

function mapOrderPaymentMethod(method) {
  // expense ENUM: cash | card | bank | worker_paid
  const map = {
    cash: "cash",
    card: "card",
    bank_transfer: "bank",
    digital_wallet: "card",
    online: "bank", // until you add 'online' to expense payment_method
  };
  return map[method] || "cash";
}

/**
 * If order is refunded/cancelled after income was recorded, mark or remove income.
 */
async function handleOrderPaymentReversal(order) {
  const entry = await Expense.findOne({
    where: { order_id: order.id, type: "income" },
  });
  if (!entry) return null;

  if (order.payment_status === "refunded") {
    await entry.update({
      payment_status: "unpaid",
      description: entry.description + " (بازگشت وجه)",
    });
    // or: await entry.destroy();
  }
  return entry;
}

module.exports = {
  ensureOrderIncome,
  handleOrderPaymentReversal,
  mapOrderPaymentMethod,
};
