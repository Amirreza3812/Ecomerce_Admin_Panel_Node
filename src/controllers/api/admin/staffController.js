const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const User = require("../../../models/entities/User");
const { ROLE_PRESETS, STAFF_ROLES } = require("../../../config/staffPermissions");

const staffAttributes = [
  "id",
  "name",
  "email",
  "phone",
  "role",
  "staff_role",
  "permissions",
  "parent_id",
  "status",
  "avatar",
  "createdAt",
  "updatedAt",
];

const listStaff = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {
    role: "admin",
    staff_role: { [Op.ne]: "owner" },
    // optional: only staff created by this owner
    // parent_id: req.user.id,
  };
  if (status) where.status = status;

  // Owner sees staff under them; super_admin sees all staff
  if (req.user.role !== "super_admin") {
    where.parent_id = req.user.id;
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: staffAttributes,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  res.json({
    success: true,
    data: {
      staff: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit) || 0,
        limit: parseInt(limit),
      },
    },
  });
});

const getStaff = catchAsync(async (req, res, next) => {
  const where = {
    id: req.params.id,
    role: "admin",
    staff_role: { [Op.ne]: "owner" },
  };
  if (req.user.role !== "super_admin") {
    where.parent_id = req.user.id;
  }

  const staff = await User.findOne({ where, attributes: staffAttributes });
  if (!staff) return next(new AppError("کاربر یافت نشد", 404));

  res.json({ success: true, data: staff });
});

const createStaff = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, staff_role, permissions } = req.body;

  if (!name || !email || !password || !staff_role) {
    return next(
      new AppError("name, email, password و staff_role الزامی هستند", 400)
    );
  }
  if (!STAFF_ROLES.includes(staff_role)) {
    return next(
      new AppError("staff_role نامعتبر: " + STAFF_ROLES.join(", "), 400)
    );
  }
  if (password.length < 6) {
    return next(new AppError("رمز عبور حداقل ۶ کاراکتر", 400));
  }

  const exists = await User.findOne({ where: { email } });
  if (exists) return next(new AppError("این ایمیل قبلاً ثبت شده", 400));

  let perms =
    Array.isArray(permissions) && permissions.length
      ? permissions
      : ROLE_PRESETS[staff_role] || [];

  const hash = await bcrypt.hash(password, 12);

  const staff = await User.create({
    name,
    email,
    password: hash,
    phone: phone || null,
    role: "admin",
    staff_role,
    permissions: perms,
    parent_id: req.user.id,
    status: "active",
  });

  const safe = await User.findByPk(staff.id, { attributes: staffAttributes });

  res.status(201).json({
    success: true,
    message: "مدیر ایجاد شد",
    data: safe,
  });
});

const updateStaff = catchAsync(async (req, res, next) => {
  const where = {
    id: req.params.id,
    role: "admin",
    staff_role: { [Op.ne]: "owner" },
  };
  if (req.user.role !== "super_admin") {
    where.parent_id = req.user.id;
  }

  const staff = await User.findOne({ where });
  if (!staff) return next(new AppError("کاربر یافت نشد", 404));

  const { name, phone, staff_role, permissions, status } = req.body;
  const data = {};

  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (status !== undefined) {
    if (!["active", "inactive"].includes(status)) {
      return next(new AppError("status باید active یا inactive باشد", 400));
    }
    data.status = status;
  }
  if (staff_role !== undefined) {
    if (!STAFF_ROLES.includes(staff_role)) {
      return next(new AppError("staff_role نامعتبر", 400));
    }
    data.staff_role = staff_role;
    if (permissions === undefined) {
      data.permissions = ROLE_PRESETS[staff_role] || [];
    }
  }
  if (permissions !== undefined) {
    data.permissions = Array.isArray(permissions) ? permissions : [];
  }

  await staff.update(data);
  const safe = await User.findByPk(staff.id, { attributes: staffAttributes });

  res.json({ success: true, message: "به‌روزرسانی شد", data: safe });
});

const updateStaffPassword = catchAsync(async (req, res, next) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return next(new AppError("رمز عبور حداقل ۶ کاراکتر", 400));
  }

  const where = {
    id: req.params.id,
    role: "admin",
    staff_role: { [Op.ne]: "owner" },
  };
  if (req.user.role !== "super_admin") {
    where.parent_id = req.user.id;
  }

  const staff = await User.findOne({ where });
  if (!staff) return next(new AppError("کاربر یافت نشد", 404));

  const hash = await bcrypt.hash(password, 12);
  await staff.update({
    password: hash,
    token_version: (staff.token_version || 1) + 1,
  });

  res.json({ success: true, message: "رمز عبور تغییر کرد" });
});

const deactivateStaff = catchAsync(async (req, res, next) => {
  const where = {
    id: req.params.id,
    role: "admin",
    staff_role: { [Op.ne]: "owner" },
  };
  if (req.user.role !== "super_admin") {
    where.parent_id = req.user.id;
  }

  const staff = await User.findOne({ where });
  if (!staff) return next(new AppError("کاربر یافت نشد", 404));

  await staff.update({
    status: "inactive",
    token_version: (staff.token_version || 1) + 1,
  });

  res.json({ success: true, message: "مدیر غیرفعال شد" });
});

module.exports = {
  listStaff,
  getStaff,
  createStaff,
  updateStaff,
  updateStaffPassword,
  deactivateStaff,
};