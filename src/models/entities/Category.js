// models/Category.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Category = sequelize.define(
  "Category",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [2, 50] },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    icon: {
      // Changed from image to icon
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Category icon filename",
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    tableName: "categories",
    indexes: [{ unique: true, fields: ["name"] }, { fields: ["status"] }],
  }
);

module.exports = Category;
