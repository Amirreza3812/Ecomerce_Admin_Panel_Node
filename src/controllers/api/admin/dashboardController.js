const catchAsync = require("../../../utils/catchAsync");
const User = require("../../../models/entities/User");
const Product = require("../../../models/entities/Product");
const Category = require("../../../models/entities/Category");
const Order = require("../../../models/entities/Order");
const OrderItem = require("../../../models/entities/OrderItem");
const Comment = require("../../../models/entities/Comment");
const { Op } = require("sequelize");

// Get dashboard overview statistics
const getDashboardOverview = catchAsync(async (req, res) => {
  const { period = "month" } = req.query;

  let startDate = new Date();
  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  // Get current period data
  const currentPeriodPromises = [
    User.count({
      where: {
        createdAt: { [Op.gte]: startDate },
        role: "customer",
      },
    }),
    Order.count({
      where: {
        createdAt: { [Op.gte]: startDate }, // Changed from 'order_date' to 'createdAt'
        status: { [Op.not]: "cancelled" },
      },
    }),
    Order.sum("total_amount", {
      where: {
        createdAt: { [Op.gte]: startDate }, // Changed from 'order_date' to 'createdAt'
        status: { [Op.not]: "cancelled" },
      },
    }),
    Product.count({
      where: { status: "active" },
    }),
  ];

  // Get previous period for comparison
  let previousStartDate = new Date(startDate);
  let previousEndDate = new Date(startDate);

  switch (period) {
    case "week":
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      break;
    case "month":
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);
      break;
    case "year":
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
      break;
  }

  const previousPeriodPromises = [
    User.count({
      where: {
        createdAt: { [Op.between]: [previousStartDate, previousEndDate] },
        role: "customer",
      },
    }),
    Order.count({
      where: {
        createdAt: { [Op.between]: [previousStartDate, previousEndDate] }, // Changed from 'order_date' to 'createdAt'
        status: { [Op.not]: "cancelled" },
      },
    }),
    Order.sum("total_amount", {
      where: {
        createdAt: { [Op.between]: [previousStartDate, previousEndDate] }, // Changed from 'order_date' to 'createdAt'
        status: { [Op.not]: "cancelled" },
      },
    }),
  ];

  const [currentResults, previousResults] = await Promise.all([
    Promise.all(currentPeriodPromises),
    Promise.all(previousPeriodPromises),
  ]);

  const [newCustomers, totalOrders, totalRevenue, activeProducts] =
    currentResults;
  const [prevNewCustomers, prevTotalOrders, prevTotalRevenue] = previousResults;

  // Calculate percentage changes
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const stats = {
    newCustomers: {
      value: newCustomers,
      change: calculateChange(newCustomers, prevNewCustomers),
    },
    totalOrders: {
      value: totalOrders,
      change: calculateChange(totalOrders, prevTotalOrders),
    },
    totalRevenue: {
      value: parseFloat(totalRevenue || 0),
      change: calculateChange(
        parseFloat(totalRevenue || 0),
        parseFloat(prevTotalRevenue || 0)
      ),
    },
    activeProducts: {
      value: activeProducts,
      change: 0, // Products don't have comparison period
    },
    averageOrderValue: {
      value: totalOrders > 0 ? parseFloat(totalRevenue || 0) / totalOrders : 0,
      change: 0,
    },
  };

  res.json({
    success: true,
    data: stats,
  });
});

// Get recent activities
const getRecentActivities = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  const [recentOrders, recentCustomers, recentComments] = await Promise.all([
    Order.findAll({
      limit: parseInt(limit),
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
      attributes: ["id", "total_amount", "status", "createdAt"],
    }),
    User.findAll({
      where: { role: "customer" },
      limit: parseInt(limit),
      order: [["createdAt", "DESC"]],
      attributes: ["id", "name", "email", "createdAt"],
    }),
    Comment.findAll({
      limit: parseInt(limit),
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "name"],
        },
      ],
      attributes: ["id", "comment", "rating", "createdAt"],
    }),
  ]);

  const activities = [];

  // Add recent orders
  recentOrders.forEach((order) => {
    activities.push({
      type: "order",
      id: order.id,
      title: `New Order #${order.id}`,
      description: `${order.user.name} placed an order worth $${order.total_amount}`,
      status: order.status,
      timestamp: order.createdAt,
      user: order.user,
    });
  });

  // Add recent customers
  recentCustomers.forEach((customer) => {
    activities.push({
      type: "customer",
      id: customer.id,
      title: "New Customer Registration",
      description: `${customer.name} joined the platform`,
      timestamp: customer.createdAt,
      user: customer,
    });
  });

  // Add recent comments
  recentComments.forEach((comment) => {
    activities.push({
      type: "comment",
      id: comment.id,
      title: "New Product Review",
      description: `${comment.user.name} rated ${comment.product.name} (${comment.rating}/5)`,
      rating: comment.rating,
      timestamp: comment.createdAt,
      user: comment.user,
      product: comment.product,
    });
  });

  // Sort all activities by timestamp
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({
    success: true,
    data: activities.slice(0, parseInt(limit)),
  });
});

// Get sales chart data
const getSalesChart = catchAsync(async (req, res) => {
  const { period = "week" } = req.query;

  let startDate = new Date();
  let dateFormat, groupBy;

  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      dateFormat = "%Y-%m-%d";
      groupBy = "day";
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      dateFormat = "%Y-%m-%d";
      groupBy = "day";
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      dateFormat = "%Y-%m";
      groupBy = "month";
      break;
  }

  // Get previous period dates
  let previousStartDate = new Date(startDate);
  let previousEndDate = new Date(startDate);

  switch (period) {
    case "week":
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      break;
    case "month":
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);
      break;
    case "year":
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
      break;
  }

  // Get current period data
  const currentPeriodData = await Order.findAll({
    where: {
      createdAt: { [Op.gte]: startDate },
      status: { [Op.not]: "cancelled" },
    },
    attributes: [
      [
        Order.sequelize.fn("DATE_FORMAT", Order.sequelize.col("createdAt"), dateFormat),
        "period",
      ],
      [Order.sequelize.fn("COUNT", Order.sequelize.col("id")), "orders"],
      [
        Order.sequelize.fn("SUM", Order.sequelize.col("total_amount")),
        "revenue",
      ],
    ],
    group: [
      Order.sequelize.fn("DATE_FORMAT", Order.sequelize.col("createdAt"), dateFormat),
    ],
    order: [
      [
        Order.sequelize.fn("DATE_FORMAT", Order.sequelize.col("createdAt"), dateFormat),
        "ASC",
      ],
    ],
  });

  // Get previous period data
  const previousPeriodData = await Order.findAll({
    where: {
      createdAt: { [Op.between]: [previousStartDate, previousEndDate] },
      status: { [Op.not]: "cancelled" },
    },
    attributes: [
      [
        Order.sequelize.fn("DATE_FORMAT", Order.sequelize.col("createdAt"), dateFormat),
        "period",
      ],
      [Order.sequelize.fn("COUNT", Order.sequelize.col("id")), "orders"],
      [
        Order.sequelize.fn("SUM", Order.sequelize.col("total_amount")),
        "revenue",
      ],
    ],
    group: [
      Order.sequelize.fn("DATE_FORMAT", Order.sequelize.col("createdAt"), dateFormat),
    ],
  });

  // Calculate totals for both periods
  const currentTotalRevenue = currentPeriodData.reduce(
    (sum, item) => sum + parseFloat(item.get("revenue") || 0), 0
  );
  const previousTotalRevenue = previousPeriodData.reduce(
    (sum, item) => sum + parseFloat(item.get("revenue") || 0), 0
  );

  // Calculate percentage change
  const revenueChange = previousTotalRevenue > 0 
    ? Math.round(((currentTotalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100)
    : 0;

  const chartData = currentPeriodData.map((item) => ({
    period: item.get("period"),
    orders: parseInt(item.get("orders")),
    revenue: parseFloat(item.get("revenue")),
  }));

  res.json({
    success: true,
    data: {
      period,
      chartData,
      revenueChange,
    },
  });
});

// get recent-orders
const getRecentOrders = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  const recentOrders = await Order.findAll({
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
    attributes: ["id", "order_number", "total_amount", "status", "createdAt"],
  });

  const formattedOrders = recentOrders.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.user ? order.user.name : "Guest",
    customerEmail: order.user ? order.user.email : "",
    totalAmount: parseFloat(order.total_amount),
    status: order.status,
    createdAt: order.createdAt,
  }));

  res.json({
    success: true,
    data: formattedOrders,
  });
});

// Get top products
const getTopProducts = catchAsync(async (req, res) => {
  const { period = "month", limit = 10 } = req.query;

  let startDate = new Date();
  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const topProducts = await OrderItem.findAll({
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["id", "name", "price", "image"],
      },
      {
        model: Order,
        as: "order",
        where: {
          createdAt: { [Op.gte]: startDate }, // Changed from 'order_date' to 'createdAt'
          status: { [Op.not]: "cancelled" },
        },
        attributes: [],
      },
    ],
    attributes: [
      "product_id",
      [
        OrderItem.sequelize.fn("SUM", OrderItem.sequelize.col("quantity")),
        "totalQuantity",
      ],
      [
        OrderItem.sequelize.fn(
          "SUM",
          OrderItem.sequelize.literal("quantity * price")
        ),
        "totalRevenue",
      ],
      [
        OrderItem.sequelize.fn(
          "COUNT",
          OrderItem.sequelize.col("OrderItem.id")
        ),
        "orderCount",
      ],
    ],
    group: ["product_id"],
    order: [
      [
        OrderItem.sequelize.fn("SUM", OrderItem.sequelize.col("quantity")),
        "DESC",
      ],
    ],
    limit: parseInt(limit),
  });

  const formattedProducts = topProducts.map((item) => ({
    product: item.product,
    totalQuantity: parseInt(item.get("totalQuantity")),
    totalRevenue: parseFloat(item.get("totalRevenue")),
    orderCount: parseInt(item.get("orderCount")),
  }));

  res.json({
    success: true,
    data: formattedProducts,
  });
});

// get session data
const getSessionsData = catchAsync(async (req, res) => {
  const { period = "week" } = req.query;

  let startDate = new Date();
  let dateFormat, groupBy;

  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      dateFormat = "%Y-%m-%d";
      groupBy = "day";
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      dateFormat = "%Y-%m-%d";
      groupBy = "day";
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      dateFormat = "%Y-%m";
      groupBy = "month";
      break;
  }

  // Since you don't have a sessions table, we'll use orders as a proxy for sessions
  // In a real application, you would have a dedicated sessions/analytics table
  const sessionsData = await Order.findAll({
    where: {
      createdAt: { [Op.gte]: startDate },
      status: { [Op.not]: "cancelled" },
    },
    attributes: [
      [
        Order.sequelize.fn(
          "DATE_FORMAT",
          Order.sequelize.col("createdAt"),
          dateFormat
        ),
        "period",
      ],
      [Order.sequelize.fn("COUNT", Order.sequelize.col("id")), "sessions"],
    ],
    group: [
      Order.sequelize.fn(
        "DATE_FORMAT",
        Order.sequelize.col("createdAt"),
        dateFormat
      ),
    ],
    order: [
      [
        Order.sequelize.fn(
          "DATE_FORMAT",
          Order.sequelize.col("createdAt"),
          dateFormat
        ),
        "ASC",
      ],
    ],
  });

  // Transform data for the chart
  const chartData = sessionsData.map((item) => ({
    period: item.get("period"),
    sessions: parseInt(item.get("sessions")),
  }));

  // For demonstration, we'll create mock data for different session types
  // In a real application, you would track these separately
  const mockData = {
    direct: chartData.map((item) =>
      Math.floor(item.sessions * 0.4 + Math.random() * item.sessions * 0.2)
    ),
    referral: chartData.map((item) =>
      Math.floor(item.sessions * 0.3 + Math.random() * item.sessions * 0.2)
    ),
    organic: chartData.map((item) =>
      Math.floor(item.sessions * 0.3 + Math.random() * item.sessions * 0.2)
    ),
  };

  res.json({
    success: true,
    data: {
      period,
      chartData: mockData,
    },
  });
});



// Get order status distribution
const getOrderStatusDistribution = catchAsync(async (req, res) => {
  const { period = "month" } = req.query;

  let startDate = new Date();
  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const statusDistribution = await Order.findAll({
    where: {
      createdAt: { [Op.gte]: startDate }, // Changed from 'order_date' to 'createdAt'
    },
    attributes: [
      "status",
      [Order.sequelize.fn("COUNT", Order.sequelize.col("id")), "count"],
    ],
    group: ["status"],
  });

  const distribution = statusDistribution.reduce((acc, item) => {
    acc[item.status] = parseInt(item.get("count"));
    return acc;
  }, {});

  res.json({
    success: true,
    data: distribution,
  });
});

module.exports = {
  getDashboardOverview,
  getRecentActivities,
  getSalesChart,
  getTopProducts,
  getOrderStatusDistribution,
  getRecentOrders,
  getSessionsData,
};
