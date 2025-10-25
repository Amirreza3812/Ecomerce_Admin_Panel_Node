const express = require("express");
const categoryController = require("../../../controllers/api/v1/public/categoryController");
const productController = require("../../../controllers/api/v1/public/productController");
const { protect } = require("../../../middlewares/auth");
const { validateRating } = require("../../../middlewares/validation");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Coffee"
 *         description:
 *           type: string
 *           example: "Various coffee drinks and beverages"
 *         icon:
 *           type: string
 *           example: "coffee-icon.svg"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: "active"
 *         sort_order:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-06T16:47:26.204Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-06T16:47:26.204Z"
 *         subcategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubCategory'
 *     SubCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         category_id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Espresso"
 *         description:
 *           type: string
 *           example: "Strong black coffee"
 *         icon:
 *           type: string
 *           example: "espresso-icon.svg"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: "active"
 *         sort_order:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-06T16:47:26.204Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-06T16:47:26.204Z"
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Espresso"
 *         description:
 *           type: string
 *           example: "Strong black coffee"
 *         price:
 *           type: number
 *           format: decimal
 *           example: 3.99
 *         sale_price:
 *           type: number
 *           format: decimal
 *           example: 2.99
 *         image:
 *           type: string
 *           example: "https://example.com/espresso.jpg"
 *         rating:
 *           type: number
 *           example: 4.5
 *         total_reviews:
 *           type: integer
 *           example: 15
 *         is_featured:
 *           type: boolean
 *           example: true
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: "active"
 *         subcategory_id:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-06T16:47:26.204Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-06T16:47:26.204Z"
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operation successful"
 *         data:
 *           type: object
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operation successful"
 *         data:
 *           type: array
 *           items:
 *             type: object
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 12
 *             total:
 *               type: integer
 *               example: 50
 *             pages:
 *               type: integer
 *               example: 5
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Error message"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/v1/public/categories:
 *   get:
 *     summary: Get all active categories
 *     description: Retrieve all active categories with their subcategories and featured products
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/categories", categoryController.getAllCategories);

/**
 * @swagger
 * /api/v1/public/categories/stats:
 *   get:
 *     summary: Get category statistics
 *     description: Retrieve statistics for all categories including product counts
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

router.get("/categories/stats", categoryController.getCategoryStats);

/**
 * @swagger
 * /api/v1/public/categories/icons:
 *   get:
 *     summary: Get all available category icons
 *     description: Retrieve all available category icons for public use
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category icons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "coffee-icon.svg"
 *                           url:
 *                             type: string
 *                             example: "http://localhost:3000/icons/category-icons/coffee-icon.svg"
 *       404:
 *         description: Category icons directory not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/categories/icons", categoryController.getCategoryIcons);


/**
 * @swagger
 * /api/v1/public/subcategories/icons:
 *   get:
 *     summary: Get all available subcategory icons
 *     description: Retrieve all available subcategory icons for public use
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Subcategory icons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "espresso-icon.svg"
 *                           url:
 *                             type: string
 *                             example: "http://localhost:3000/icons/subcategory-icons/espresso-icon.svg"
 *       404:
 *         description: Subcategory icons directory not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/subcategories/icons", categoryController.getSubCategoryIcons);

// Category routes with parameters - must come after static routes
/**
 * @swagger
 * /api/v1/public/categories/{identifier}:
 *   get:
 *     summary: Get single category
 *     description: Retrieve a specific category by ID or slug with all its subcategories and products
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: integer
 *               description: Category ID
 *             - type: string
 *               description: Category slug
 *         examples:
 *           byId:
 *             value: 1
 *             summary: Get by ID
 *           bySlug:
 *             value: "coffee"
 *             summary: Get by slug
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/categories/:identifier", categoryController.getCategory);

// Product routes
/**
 * @swagger
 * /api/v1/public/products:
 *   get:
 *     summary: Get all products with filtering and pagination
 *     description: Retrieve products with optional filtering, search, and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 12
 *         description: Number of products per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category slug
 *         example: coffee
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *         description: Filter by subcategory slug
 *         example: hot-coffee
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *         example: 2.00
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *         example: 10.00
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating filter
 *         example: 4.0
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name and description
 *         example: espresso
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured products only
 *         example: true
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price_low, price_high, rating, newest, popular]
 *         description: Sort products by criteria
 *         example: price_low
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get("/products", productController.getAllProducts);

/**
 * @swagger
 * /api/v1/public/products/sale:
 *   get:
 *     summary: Get products on sale
 *     description: Retrieve products currently on sale with discount information
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 12
 *         description: Number of products per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [discount, price_low, price_high, rating, newest, popular]
 *           default: discount
 *         description: Sort products by criteria
 *         example: discount
 *     responses:
 *       200:
 *         description: Sale products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Product'
 *                           - type: object
 *                             properties:
 *                               is_on_sale:
 *                                 type: boolean
 *                                 description: Whether the product is currently on sale
 *                                 example: true
 *                               effective_price:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Current price (sale price if on sale, otherwise regular price)
 *                                 example: 8.99
 *                               discount_percentage:
 *                                 type: integer
 *                                 description: Discount percentage
 *                                 example: 25
 */
router.get("/products/sale", productController.getSaleProducts);

/**
 * @swagger
 * /api/v1/public/products/featured:
 *   get:
 *     summary: Get featured products
 *     description: Retrieve featured products for homepage or promotional displays
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 8
 *         description: Number of featured products to return
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get("/products/featured", productController.getFeaturedProducts);

/**
 * @swagger
 * /api/v1/public/products/{identifier}:
 *   get:
 *     summary: Get single product
 *     description: Retrieve detailed information about a specific product including reviews
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: integer
 *               description: Product ID
 *             - type: string
 *               description: Product slug
 *         examples:
 *           byId:
 *             value: 1
 *             summary: Get by ID
 *           bySlug:
 *             value: "espresso"
 *             summary: Get by slug
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/products/:identifier", productController.getProduct);

/**
 * @swagger
 * /api/v1/public/products/{id}/related:
 *   get:
 *     summary: Get related products
 *     description: Retrieve products related to a specific product (same subcategory)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           default: 6
 *         description: Number of related products to return
 *     responses:
 *       200:
 *         description: Related products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/products/:id/related", productController.getRelatedProducts);

/**
 * @swagger
 * /api/v1/public/products/{id}/rate:
 *   post:
 *     summary: Rate a product
 *     description: Submit a rating for a product (1-5 stars)
 *     tags: [Products, Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating value (1-5)
 *                 example: 4
 *     responses:
 *       200:
 *         description: Product rated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         rating:
 *                           type: integer
 *                           example: 4
 *                         productRating:
 *                           type: object
 *                           properties:
 *                             rating:
 *                               type: number
 *                               example: 4.2
 *                             total_reviews:
 *                               type: integer
 *                               example: 15
 *       400:
 *         description: Invalid rating value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/products/:id/rate",
  protect,
  validateRating,
  productController.rateProduct
);

/**
 * @swagger
 * /api/v1/public/products/{id}/ratings:
 *   get:
 *     summary: Get product ratings
 *     description: Retrieve all ratings for a specific product with pagination
 *     tags: [Products, Ratings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Number of ratings per page
 *     responses:
 *       200:
 *         description: Product ratings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         productRating:
 *                           type: object
 *                           properties:
 *                             rating:
 *                               type: number
 *                               example: 4.2
 *                             total_reviews:
 *                               type: integer
 *                               example: 15
 *                         distribution:
 *                           type: object
 *                           properties:
 *                             1:
 *                               type: integer
 *                               example: 1
 *                             2:
 *                               type: integer
 *                               example: 2
 *                             3:
 *                               type: integer
 *                               example: 3
 *                             4:
 *                               type: integer
 *                               example: 5
 *                             5:
 *                               type: integer
 *                               example: 4
 *                         ratings:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               rating:
 *                                 type: integer
 *                                 example: 4
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               user:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   name:
 *                                     type: string
 *                                   avatar:
 *                                     type: string
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                               example: 1
 *                             limit:
 *                               type: integer
 *                               example: 10
 *                             total:
 *                               type: integer
 *                               example: 15
 *                             pages:
 *                               type: integer
 *                               example: 2
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/products/:id/ratings", productController.getProductRatings);

/**
 * @swagger
 * /api/v1/public/products/top-rated:
 *   get:
 *     summary: Get top rated products
 *     description: Retrieve products with highest ratings
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Number of products to return
 *       - in: query
 *         name: minReviews
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 3
 *         description: Minimum number of reviews a product must have
 *     responses:
 *       200:
 *         description: Top rated products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Product'
 *                           - type: object
 *                             properties:
 *                               effective_price:
 *                                 type: number
 *                                 format: decimal
 *                                 description: Current price (sale price if on sale, otherwise regular price)
 *                                 example: 8.99
 *                               is_on_sale:
 *                                 type: boolean
 *                                 description: Whether the product is currently on sale
 *                                 example: true
 *                               discount_percentage:
 *                                 type: integer
 *                                 description: Discount percentage
 *                                 example: 25
 */
router.get("/products/top-rated", productController.getTopRatedProducts);

module.exports = router;
