EXPRESS_ADMIN_PANEL/
│
├── scripts/                          # اسکریپت‌های جانبی (در صورت نیاز برای setup یا migration)
│   └── setup.js
│
├── src/                             
│   ├── config/                       # فایل‌های تنظیمات (مثل دیتابیس، JWT، dotenv و غیره)
│   │   └── db.js
│   │
│   ├── controllers/                  # کنترلرها (منطق اصلی هر ماژول)
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │    ├── adminAuthController.js
│   │   │   │    ├── categoryController.js
│   │   │   │    ├── customerManagementController.js
│   │   │   │    ├── dashboardController.js
│   │   │   │    ├── orderController.js
│   │   │   │    ├── priceController.js
│   │   │   │    ├── productController.js
│   │   │   │    ├── reportsController.js
│   │   │   │    ├── salesController.js
│   │   │   │    ├── subCategoryController.js
│   │   │   │    └── userController.js
│   │   │   ├── v1/
│   │   │   │   ├── public/
│   │   │   │   |   ├── categoryController.js
│   │   │   │   |   ├── commentController.js
│   │   │   │   |   ├── favoriteController.js
│   │   │   │   |   ├── productController.js
│   │   │   │   |   └── userController.js
│   │   │   │   └── authController.js
│   │   ├── adminController.js
│   │   └── authController.js
|   |
│   ├── middlewares/  
│   │   ├── adminAuth.js 
│   │   ├── auth.js 
│   │   ├── authMiddleware.js 
│   │   ├── errorHandler.js 
│   │   ├── upload.js 
│   │   ├── validateProject.js 
│   │   └── validation.js
│   │
│   ├── models/                       # مدل‌ها و موجودیت‌های دیتابیس
│   │   ├── entities/
│   │   |   ├── Category.js           # مدل دسته‌بندی اصلی
│   │   |   ├── SubCategory.js        # مدل زیر‌دسته
│   │   |   ├── Product.js            # مدل محصول
│   │   |   ├── Order.js              # مدل سفارش
│   │   |   ├── OrderItem.js          # مدل آیتم‌های هر سفارش
│   │   |   ├── Comment.js            # مدل نظرات
│   │   |   ├── Favorite.js           # مدل علاقه‌مندی‌ها
│   │   |   └── User.js               # مدل کاربران
│   │   └── associations.js       # تعریف روابط بین مدل‌ها (Sequelize relations)
│   │
│   ├── routes/                       # تعریف مسیرهای API
│   │   ├── admin/                    # مسیرهای مربوط به پنل ادمین
│   │   │   ├── authRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── customerRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── priceRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── reportsRoutes.js
│   │   │   ├── subcategoryRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── index.js              # نقطه ورود کلی روت‌ها (تجمیع مسیرها)
│   │   │
│   │   └── api/                      # مسیرهای عمومی (برای کاربران و اپ)
│   │       └── v1/
│   │           ├── auth.js
│   │           ├── comments.js
│   │           ├── favorites.js
│   │           └── public.js
│   │   
│   │
│   └── utils/                        # ابزارها و توابع کمکی
│       ├── apiResponse.js            # پاسخ‌دهی استاندارد API (success / error format)
│       ├── AppError.js               # تعریف کلاس خطاهای کاستوم
│       ├── catchAsync.js             # هندل کردن ارورهای async/await
│       └── dbHelpers.js              # توابع کمکی برای کوئری‌های دیتابیس
│   
├── uploads/                      # محل ذخیره فایل‌های آپلودشده (تصاویر، ویدیوها و ...)
│   
├── swagger.js
│   
├── test-endpoints.js
│   
├── test-frontend-ready.js
│   
├── env
│   
├── server.js                     # فایل ورودی اصلی (راه‌اندازی express)
│
└── package.json                      # وابستگی‌ها و اسکریپت‌های پروژه
