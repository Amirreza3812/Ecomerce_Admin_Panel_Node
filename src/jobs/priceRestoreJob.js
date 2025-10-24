// src/jobs/priceRestoreJob.js
const cron = require("node-cron");
const { Product } = require("../models/associations");
const { Op } = require("sequelize");
const { sequelize } = require("../config/db");

// Schedule the job to run daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily job to restore expired sales...");

  try {
    // Ensure database connection is established
    await sequelize.authenticate();
    console.log("Database connection established for price restore job.");

    const today = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD

    // Find products with expired sales
    const productsToUpdate = await Product.findAll({
      where: {
        sale_end_date: {
          [Op.lt]: today,
        },
        original_price: { [Op.not]: null },
      },
    });

    if (productsToUpdate.length === 0) {
      console.log("No products with expired sales found");
      return;
    }

    console.log(`Found ${productsToUpdate.length} products with expired sales`);

    // Restore original prices
    const updatePromises = productsToUpdate.map((product) => {
      console.log(
        `Restoring price for product ${product.id}: ${product.name} from ${product.price} to ${product.original_price}`
      );

      return Product.update(
        {
          price: product.original_price,
          original_price: null, // Clear the original price
          sale_price: null,
          sale_start_date: null,
          sale_end_date: null,
        },
        { where: { id: product.id } }
      );
    });

    await Promise.all(updatePromises);
    console.log(
      `Successfully restored original prices for ${productsToUpdate.length} products with expired sales`
    );
  } catch (error) {
    console.error("Error in price restore job:", error);
  }
});

console.log("Scheduled job to restore expired sales daily at midnight");
