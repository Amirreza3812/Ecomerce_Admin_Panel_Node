const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const ApiResponse = require("../../../utils/apiResponse");
const Worker = require("../../../models/entities/Worker");
const { Op } = require("sequelize");

// GET /api/v1/admin/workers
const getAllWorkers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { job_title: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Worker.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["name", "ASC"]],
  });

  res.json({
    success: true,
    data: {
      workers: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit),
      },
    },
  });
});

// GET /api/v1/admin/workers/:id
const getWorker = catchAsync(async (req, res, next) => {
  const worker = await Worker.findByPk(req.params.id);
  if (!worker) return next(new AppError("Worker not found", 404));
  ApiResponse.success(res, worker, "Worker retrieved successfully");
});

// POST /api/v1/admin/workers
const createWorker = catchAsync(async (req, res, next) => {
  const { name, phone, email, job_title, hire_date, base_salary, status, notes } =
    req.body;

  if (!name || name.trim().length < 2) {
    return next(new AppError("Name is required (min 2 characters)", 400));
  }

  const worker = await Worker.create({
    name: name.trim(),
    phone: phone || null,
    email: email || null,
    job_title: job_title || null,
    hire_date: hire_date || null,
    base_salary: base_salary ?? 0,
    status: status || "active",
    notes: notes || null,
  });

  res.status(201).json({
    success: true,
    message: "Worker created successfully",
    data: worker,
  });
});

// PATCH /api/v1/admin/workers/:id
const updateWorker = catchAsync(async (req, res, next) => {
  const worker = await Worker.findByPk(req.params.id);
  if (!worker) return next(new AppError("Worker not found", 404));

  const allowed = [
    "name",
    "phone",
    "email",
    "job_title",
    "hire_date",
    "base_salary",
    "status",
    "notes",
  ];
  const data = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  });

  await worker.update(data);
  ApiResponse.success(res, worker, "Worker updated successfully");
});

// DELETE /api/v1/admin/workers/:id  (soft: set inactive)
const deleteWorker = catchAsync(async (req, res, next) => {
  const worker = await Worker.findByPk(req.params.id);
  if (!worker) return next(new AppError("Worker not found", 404));

  await worker.update({ status: "inactive" });
  ApiResponse.success(res, null, "Worker deactivated successfully");
});

// GET /api/v1/admin/workers/stats/summary
const getWorkerStats = catchAsync(async (req, res) => {
  const total = await Worker.count();
  const active = await Worker.count({ where: { status: "active" } });
  const inactive = total - active;

  res.json({
    success: true,
    data: { total, active, inactive },
  });
});

module.exports = {
  getAllWorkers,
  getWorker,
  createWorker,
  updateWorker,
  deleteWorker,
  getWorkerStats,
};