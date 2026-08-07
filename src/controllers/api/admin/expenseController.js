const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const ApiResponse = require("../../../utils/apiResponse");
const Expense = require("../../../models/entities/Expense");
const Worker = require("../../../models/entities/Worker");
const Order = require("../../../models/entities/Order");
const { Op } = require("sequelize");

const getAllExpenses = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    worker_id,
    category,
    payment_method,
    payment_status,
    type, // "income" | "expense"
    from,
    to,
    search,
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  if (worker_id) where.worker_id = worker_id;
  if (category) where.category = category;
  if (payment_method) where.payment_method = payment_method;
  if (payment_status) where.payment_status = payment_status;

  // NEW: filter income vs expense
  if (type && (type === "income" || type === "expense")) {
    where.type = type;
  }

  if (from || to) {
    where.expense_date = {};
    if (from) where.expense_date[Op.gte] = from;
    if (to) where.expense_date[Op.lte] = to;
  }
  if (search) {
    where.description = { [Op.like]: `%${search}%` };
  }

  const { count, rows } = await Expense.findAndCountAll({
    where,
    include: [
      {
        model: Worker,
        as: "worker",
        attributes: ["id", "name", "job_title"],
        required: false,
      },
      // NEW: link to order for sales income (only if association exists)
      {
        model: Order,
        as: "order",
        attributes: [
          "id",
          "order_number",
          "final_amount",
          "payment_method",
          "payment_status",
        ],
        required: false,
      },
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [
      ["expense_date", "DESC"],
      ["id", "DESC"],
    ],
  });

  res.json({
    success: true,
    data: {
      expenses: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit) || 0,
        limit: parseInt(limit),
      },
    },
  });
});

const getExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findByPk(req.params.id, {
    include: [
      {
        model: Worker,
        as: "worker",
        attributes: ["id", "name", "phone", "job_title"],
        required: false,
      },
    ],
  });
  if (!expense) return next(new AppError("Expense not found", 404));
  ApiResponse.success(res, expense, "Expense retrieved");
});

const createExpense = catchAsync(async (req, res, next) => {
  // body fields may be strings when using FormData
  const worker_id = req.body.worker_id || null;
  const amount = req.body.amount;
  const category = req.body.category || "other";
  const description = req.body.description || null;
  const expense_date = req.body.expense_date;
  const payment_method = req.body.payment_method || "cash";
  const payment_status = req.body.payment_status || "paid";

  if (!amount || Number(amount) <= 0) {
    return next(new AppError("Valid amount is required", 400));
  }
  if (!expense_date) {
    return next(new AppError("expense_date is required", 400));
  }

  if (worker_id) {
    const worker = await Worker.findByPk(worker_id);
    if (!worker) return next(new AppError("Worker not found", 404));
  }

  let receipt_url = req.body.receipt_url || null;
  if (req.file) {
    receipt_url = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;
  }

  const expense = await Expense.create({
    worker_id: worker_id ? Number(worker_id) : null,
    amount: Number(amount),
    category,
    description,
    expense_date,
    payment_method,
    payment_status,
    receipt_url,
    created_by: req.user?.id || null,
  });

  const full = await Expense.findByPk(expense.id, {
    include: [
      {
        model: Worker,
        as: "worker",
        attributes: ["id", "name"],
        required: false,
      },
    ],
  });

  res.status(201).json({
    success: true,
    message: "Expense recorded",
    data: full,
  });
});

const updateExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findByPk(req.params.id);
  if (!expense) return next(new AppError("Expense not found", 404));

  const allowed = [
    "worker_id",
    "amount",
    "category",
    "description",
    "expense_date",
    "payment_method",
    "payment_status",
    "receipt_url",
  ];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined && req.body[k] !== "") {
      data[k] = req.body[k];
    }
  });

  if (data.worker_id === "" || data.worker_id === "null") data.worker_id = null;
  if (data.amount !== undefined) data.amount = Number(data.amount);
  if (data.worker_id) data.worker_id = Number(data.worker_id);

  if (req.file) {
    data.receipt_url = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;
  }

  if (data.worker_id) {
    const worker = await Worker.findByPk(data.worker_id);
    if (!worker) return next(new AppError("Worker not found", 404));
  }

  await expense.update(data);

  const full = await Expense.findByPk(expense.id, {
    include: [
      {
        model: Worker,
        as: "worker",
        attributes: ["id", "name"],
        required: false,
      },
    ],
  });

  ApiResponse.success(res, full, "Expense updated");
});

const deleteExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findByPk(req.params.id);
  if (!expense) return next(new AppError("Expense not found", 404));
  await expense.destroy();
  ApiResponse.success(res, null, "Expense deleted");
});

const getExpenseStats = catchAsync(async (req, res) => {
  const { from, to } = req.query;
  const where = {};
  if (from || to) {
    where.expense_date = {};
    if (from) where.expense_date[Op.gte] = from;
    if (to) where.expense_date[Op.lte] = to;
  }

  const expenses = await Expense.findAll({
    where,
    attributes: ["amount", "category", "payment_method", "payment_status"],
  });

  let total = 0;
  let paidTotal = 0;
  let unpaidTotal = 0;
  let unpaidCount = 0;
  const byCategory = {};
  const byMethod = {};

  expenses.forEach((e) => {
    const amt = parseFloat(e.amount || 0);
    total += amt;
    if (e.payment_status === "unpaid") {
      unpaidTotal += amt;
      unpaidCount += 1;
    } else {
      paidTotal += amt;
    }
    byCategory[e.category] = (byCategory[e.category] || 0) + amt;
    byMethod[e.payment_method] = (byMethod[e.payment_method] || 0) + amt;
  });

  res.json({
    success: true,
    data: {
      totalAmount: Math.round(total * 100) / 100,
      paidTotal: Math.round(paidTotal * 100) / 100,
      unpaidTotal: Math.round(unpaidTotal * 100) / 100,
      unpaidCount,
      count: expenses.length,
      byCategory,
      byMethod,
    },
  });
});

const markExpensePaid = catchAsync(async (req, res, next) => {
  const expense = await Expense.findByPk(req.params.id);
  if (!expense) return next(new AppError("Expense not found", 404));

  await expense.update({ payment_status: "paid" });
  ApiResponse.success(res, expense, "Expense marked as paid");
});

module.exports = {
  getAllExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  markExpensePaid,
};
