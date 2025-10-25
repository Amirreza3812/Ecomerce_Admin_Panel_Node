// scripts/migrateIcons.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const migrateIcons = async () => {
  let connection;
  
  try {
    // Create a connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Connection has been established successfully.');
    
    // Check if the image column exists in Category table
    const [categoryResults] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'image'`,
      [process.env.DB_NAME]
    );
    
    if (categoryResults.length > 0) {
      // Rename image column to icon
      await connection.execute(
        `ALTER TABLE categories CHANGE COLUMN image icon VARCHAR(255)`
      );
      console.log('Renamed Category.image to Category.icon');
    } else {
      console.log('Category.image column does not exist or has already been renamed');
    }
    
    // Check if the image column exists in SubCategory table
    const [subCategoryResults] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subcategories' AND COLUMN_NAME = 'image'`,
      [process.env.DB_NAME]
    );
    
    if (subCategoryResults.length > 0) {
      // Rename image column to icon
      await connection.execute(
        `ALTER TABLE subcategories CHANGE COLUMN image icon VARCHAR(255)`
      );
      console.log('Renamed SubCategory.image to SubCategory.icon');
    } else {
      console.log('SubCategory.image column does not exist or has already been renamed');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Unable to perform migration:', error);
  } finally {
    // Close the connection
    if (connection) {
      await connection.end();
    }
  }
};

migrateIcons();