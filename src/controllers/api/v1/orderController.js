const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { sequelize } = require("../../../config/db");
const Order = require("../../../models/entities/Order");
const OrderItem = require("../../../models/entities/OrderItem");
const Product = require("../../../models/entities/Product");
const ShopSetting = require("../../../models/entities/ShopSetting");
const { Op } = require("sequelize");
const User = require("../../../models/entities/User");
const {
  getLoyaltyConfig,
  findAvailableReward,
  markRewardClaimed,
} = require("../../../services/loyaltyService");

function generateOrderNumber() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ORD-${t}-${r}`;
}

function getUnitPrice(product) {
  const now = new Date();
  const price = parseFloat(product.price);
  if (
    product.sale_price != null &&
    product.sale_start_date &&
    product.sale_end_date
  ) {
    const start = new Date(product.sale_start_date);
    const end = new Date(product.sale_end_date);
    end.setHours(23, 59, 59, 999);
    if (now >= start && now <= end) {
      return parseFloat(product.sale_price);
    }
  }
  return price;
}

async function getOnlineOffer() {
  const row = await ShopSetting.findOne({ where: { key: "online_offer" } });
  return row?.value || { enabled: false };
}

function isOfferActive(offer) {
  if (!offer?.enabled) return false;
  const now = new Date();
  if (offer.starts_at && now < new Date(offer.starts_at)) return false;
  if (offer.ends_at) {
    const end = new Date(offer.ends_at);
    end.setHours(23, 59, 59, 999);
    if (now > end) return false;
  }
  return true;
}

/**
 * POST /api/v1/orders
 * Body: {
 *   items: [{ product_id, quantity, size?, customizations?, notes? }],
 *   order_type?: dine_in | takeaway | delivery,
 *   table_number?,
 *   notes?,
 *   payment_method?: cash | card | online | ...
 * }
 */
const createMyOrder = catchAsync(async (req, res, next) => {
  const {
    items,
    order_type = "takeaway",
    table_number,
    notes,
    payment_method = "cash",
    use_loyalty_reward = false,
    loyalty_reward_at_stamp,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError("حداقل یک محصول در سفارش لازم است", 400));
  }

  const allowedTypes = ["dine_in", "takeaway", "delivery"];
  if (!allowedTypes.includes(order_type)) {
    return next(new AppError("order_type نامعتبر است", 400));
  }

  const allowedPay = [
    "cash",
    "card",
    "digital_wallet",
    "bank_transfer",
    "online",
  ];
  if (payment_method && !allowedPay.includes(payment_method)) {
    return next(new AppError("payment_method نامعتبر است", 400));
  }

  // Load products
  const productIds = items.map((i) => i.product_id);
  const products = await Product.findAll({
    where: {
      id: { [Op.in]: productIds },
      status: "active",
    },
  });

  if (products.length !== [...new Set(productIds)].length) {
    return next(new AppError("یک یا چند محصول یافت نشد یا غیرفعال است", 400));
  }

  const productMap = {};
  products.forEach((p) => {
    productMap[p.id] = p;
  });

  // Build lines + totals
  let total_amount = 0;
  const lineData = [];

  for (const line of items) {
    const qty = parseInt(line.quantity, 10);
    if (!qty || qty < 1) {
      return next(new AppError("تعداد محصول نامعتبر است", 400));
    }
    const product = productMap[line.product_id];
    if (!product) {
      return next(new AppError(`محصول ${line.product_id} نامعتبر است`, 400));
    }

    if (product.stock != null && product.stock < qty) {
      return next(new AppError(`موجودی کافی نیست: ${product.name}`, 400));
    }

    const unit_price = getUnitPrice(product);
    const total_price = Math.round(unit_price * qty * 100) / 100;
    total_amount += total_price;

    lineData.push({
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      unit_price,
      total_price,
      size: line.size || null,
      customizations: line.customizations || null,
      notes: line.notes || null,
    });
  }

  total_amount = Math.round(total_amount * 100) / 100;
  const tax_amount = 0;
  let discount_amount = 0;
  let discount_note = null;
  let loyaltyRewardToClaim = null;

  // --- Online exclusive offer ---
  if (payment_method === "online") {
    const offer = await getOnlineOffer();
    if (isOfferActive(offer) && total_amount >= (offer.min_order_amount || 0)) {
      let onlineDiscount = 0;
      if (offer.type === "percent") {
        onlineDiscount = (total_amount * Number(offer.value)) / 100;
      } else {
        onlineDiscount = Number(offer.value) || 0;
      }
      onlineDiscount = Math.min(
        Math.round(onlineDiscount * 100) / 100,
        total_amount
      );
      discount_amount += onlineDiscount;
      discount_note = offer.title || "تخفیف پرداخت آنلاین";
    }
  }

  // --- Loyalty reward claim ---
  if (use_loyalty_reward) {
    const loyaltyConfig = await getLoyaltyConfig();
    if (!loyaltyConfig.enabled) {
      return next(new AppError("باشگاه مشتریان غیرفعال است", 400));
    }

    const customer = await User.findByPk(req.user.id);
    if (!customer || customer.role !== "customer") {
      return next(
        new AppError("فقط مشتری می‌تواند از جایزه وفاداری استفاده کند", 403)
      );
    }

    const { reward, claimed, stamps } = findAvailableReward(
      customer,
      loyaltyConfig,
      loyalty_reward_at_stamp
    );

    if (!reward) {
      return next(new AppError("جایزه وفاداری در دسترس نیست", 400));
    }
    if (stamps < Number(reward.at_stamp)) {
      return next(new AppError("هنوز به این سطح نرسیده‌اید", 400));
    }
    if (claimed.includes(Number(reward.at_stamp))) {
      return next(new AppError("این جایزه قبلاً استفاده شده است", 400));
    }

    let loyaltyDiscount = 0;
    if (reward.type === "percent") {
      loyaltyDiscount = (total_amount * Number(reward.value)) / 100;
    } else if (reward.type === "fixed") {
      loyaltyDiscount = Number(reward.value) || 0;
    }
    // free_item: no automatic money discount (handle later if needed)

    loyaltyDiscount = Math.round(loyaltyDiscount * 100) / 100;
    discount_amount += loyaltyDiscount;
    discount_note = [
      discount_note,
      reward.title || `جایزه مهر ${reward.at_stamp}`,
    ]
      .filter(Boolean)
      .join(" | ");

    loyaltyRewardToClaim = { reward, customer, loyaltyConfig };
  }

  discount_amount = Math.min(
    Math.round(discount_amount * 100) / 100,
    total_amount
  );
  const final_amount =
    Math.round((total_amount + tax_amount - discount_amount) * 100) / 100;

  const t = await sequelize.transaction();
  try {
    const order = await Order.create(
      {
        user_id: req.user.id,
        order_number: generateOrderNumber(),
        total_amount,
        tax_amount,
        discount_amount,
        final_amount,
        status: "pending",
        payment_status: "pending",
        payment_method,
        order_type,
        table_number: table_number || null,
        customer_name: req.user.name,
        customer_phone: req.user.phone || null,
        notes: notes
          ? discount_note
            ? `${notes} | ${discount_note}`
            : notes
          : discount_note,
      },
      { transaction: t }
    );

    for (const line of lineData) {
      await OrderItem.create(
        { ...line, order_id: order.id },
        { transaction: t }
      );

      await Product.decrement("stock", {
        by: line.quantity,
        where: { id: line.product_id },
        transaction: t,
      });
    }

    // Mark loyalty reward as claimed only after order succeeds
    if (loyaltyRewardToClaim) {
      await markRewardClaimed(
        loyaltyRewardToClaim.customer,
        loyaltyRewardToClaim.reward,
        loyaltyRewardToClaim.loyaltyConfig
      );
    }

    await t.commit();

    const full = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image", "price"],
            },
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "سفارش ثبت شد",
      data: full,
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

/**
 * GET /api/v1/orders/me
 */
const getMyOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;
  const where = { user_id: req.user.id };
  if (status) where.status = status;

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: OrderItem,
        as: "orderItems",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "image"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    data: {
      orders: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit) || 0,
        limit: parseInt(limit),
      },
    },
  });
});

/**
 * GET /api/v1/orders/:id
 * Only own order
 */
const getMyOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({
    where: { id: req.params.id, user_id: req.user.id },
    include: [
      {
        model: OrderItem,
        as: "orderItems",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "image", "price"],
          },
        ],
      },
    ],
  });

  if (!order) {
    return next(new AppError("سفارش یافت نشد", 404));
  }

  res.json({ success: true, data: order });
});

/**
 * PATCH /api/v1/orders/:id/cancel
 * Customer can cancel only while pending
 */
const cancelMyOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({
    where: { id: req.params.id, user_id: req.user.id },
    include: [{ model: OrderItem, as: "orderItems" }],
  });

  if (!order) {
    return next(new AppError("سفارش یافت نشد", 404));
  }

  if (order.status !== "pending") {
    return next(new AppError("فقط سفارش در انتظار قابل لغو است", 400));
  }

  if (order.payment_status === "paid") {
    return next(new AppError("سفارش پرداخت‌شده از این مسیر لغو نمی‌شود", 400));
  }

  const t = await sequelize.transaction();
  try {
    await order.update({ status: "cancelled" }, { transaction: t });

    // restore stock
    for (const item of order.orderItems || []) {
      await Product.increment("stock", {
        by: item.quantity,
        where: { id: item.product_id },
        transaction: t,
      });
    }

    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }

  res.json({
    success: true,
    message: "سفارش لغو شد",
    data: { id: order.id, status: "cancelled" },
  });
});

module.exports = {
  createMyOrder,
  getMyOrders,
  getMyOrder,
  cancelMyOrder,
};
