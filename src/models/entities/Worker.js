const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Worker = sequelize.define(
  "Worker",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [2, 80] },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [10, 20] },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },
    job_title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "e.g. barista, cashier, manager",
    },
    hire_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    base_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
      validate: { min: 0 },
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "workers",
    indexes: [{ fields: ["status"] }, { fields: ["name"] }],
  }
);

module.exports = Worker;