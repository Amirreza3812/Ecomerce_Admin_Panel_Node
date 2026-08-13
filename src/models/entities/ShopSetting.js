// src/models/entities/ShopSetting.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const ShopSetting = sequelize.define(
  "ShopSetting",
  {
    key: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
  },
  { tableName: "shop_settings", timestamps: true }
);

module.exports = ShopSetting;