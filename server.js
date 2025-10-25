require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB, sequelize } = require("./src/config/db");
const globalErrorHandler = require("./src/middlewares/errorHandler");
const AppError = require("./src/utils/AppError");

// Import the scheduled job
require("./src/jobs/priceRestoreJob");


// Import New API v1 Routes
const publicApiRoutes = require("./src/routes/api/v1/public");
const authApiRoutes = require("./src/routes/api/v1/auth");
const commentsApiRoutes = require("./src/routes/api/v1/comments");
const favoritesApiRoutes = require("./src/routes/api/v1/favorites");
const adminApiRoutes = require("./src/routes/admin");

const path = require("path");
const app = express();

// Global Middlewares
app.use(
  cors()
  //   {
  //   origin: [
  //     "http://localhost:8081",
  //     "http://10.134.4.178:3000",
  //   ],
  // }
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/icons', express.static(path.join(__dirname, 'icons')));

// Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Ensure JSON responses for API routes
app.use("/api", (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// Request Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// کل روت هایی که داریم اینان کلشون
app.use("/api/v1/public", publicApiRoutes);
app.use("/api/v1/auth", authApiRoutes);
app.use("/api/v1/comments", commentsApiRoutes);
app.use("/api/v1/favorites", favoritesApiRoutes);
app.use("/api/v1/admin", adminApiRoutes); // این یه فایله که کل روت های داخل پوشه ادمین توش ایمپورت شدن یعنی دگیه نمیخواد همشو یکی یکی ایمپورت کنیم

// Swagger Documentation
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "🚀 Cafe Management API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

// اتصال به دیتابیس
connectDB();

sequelize
  .sync({ alter: true })
  .then(() => console.log("✅ Tables synced"))
  .catch((err) => console.error("❌ Sync error:", err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
