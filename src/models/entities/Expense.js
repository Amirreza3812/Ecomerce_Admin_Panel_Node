const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Expense = sequelize.define(
  "Expense",
  {
    worker_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // null = general cafe expense (rent, etc.)
      references: { model: "workers", key: "id" },
      onDelete: "SET NULL",
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
    category: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: "other",
      comment: "supplies, milk, utilities, rent, salary_advance, other",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expense_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM(
        "cash",
        "card",
        "bank",
        "worker_paid" // worker paid from own pocket → may need reimbursement
      ),
      defaultValue: "cash",
      allowNull: false,
    },
    receipt_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },
    payment_status: {
      type: DataTypes.ENUM("paid", "unpaid"),
      defaultValue: "paid",
      allowNull: false,
      comment: "Whether this bill/expense is settled",
    },
  },
  {
    timestamps: true,
    tableName: "expenses",
    indexes: [
      { fields: ["expense_date"] },
      { fields: ["worker_id"] },
      { fields: ["category"] },
    ],
  }
);

module.exports = Expense;
