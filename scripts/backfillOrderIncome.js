// scripts/backfillOrderIncome.js
const { Order } = require("../src/models/associations");
const { ensureOrderIncome } = require("../src/services/orderLedgerService");

(async () => {
  const paid = await Order.findAll({ where: { payment_status: "paid" } });
  for (const order of paid) {
    await ensureOrderIncome(order);
  }
  console.log(`Processed ${paid.length} paid orders`);
  process.exit(0);
})();
