const express = require("express");
const router = express.Router();

// Import all admin route modules
const { requireModule } = require("../../middlewares/license");
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const categoryRoutes = require("./categoryRoutes");
const subcategoryRoutes = require("./subcategoryRoutes");
const orderRoutes = require("./orderRoutes");
const userRoutes = require("./userRoutes");
const customerRoutes = require("./customerRoutes");
const priceRoutes = require("./priceRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const reportsRoutes = require("./reportsRoutes");
const workerRoutes = require("./workerRoutes");
const expenseRoutes = require("./expenseRoutes");

// Admin routes
router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/products", requireModule("products"), productRoutes);
router.use("/categories", requireModule("categories"), categoryRoutes);
router.use("/subcategories", requireModule("subcategories"), subcategoryRoutes);
router.use("/orders", requireModule("orders"), orderRoutes);
router.use("/prices", requireModule("prices"), priceRoutes);
router.use("/users", requireModule("customers"), userRoutes);
router.use("/customers", requireModule("customers"), customerRoutes);
router.use("/workers", requireModule("personnel"), workerRoutes);
router.use("/expenses", requireModule("banking"), expenseRoutes);
router.use("/reports", reportsRoutes);

module.exports = router;
