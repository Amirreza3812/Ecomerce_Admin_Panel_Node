// // src/services/iconService.js
// const axios = require('axios');
// const cache = require('memory-cache');

// class IconService {
//   constructor() {
//     this.iconApiUrl = process.env.EXTERNAL_ICON_API_URL;
//     this.apiKey = process.env.EXTERNAL_ICON_API_KEY;
//     this.cacheTimeout = 3600000; // 1 hour in milliseconds
//   }

//   async getCategoryIcons() {
//     const cacheKey = 'category-icons';
//     let cachedIcons = cache.get(cacheKey);
    
//     if (cachedIcons) {
//       return cachedIcons;
//     }

//     try {
//       const response = await axios.get(`${this.iconApiUrl}/categories/icons`, {
//         headers: {
//           'Authorization': `Bearer ${this.apiKey}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       const icons = response.data;
//       cache.put(cacheKey, icons, this.cacheTimeout);
//       return icons;
//     } catch (error) {
//       console.error('Error fetching category icons:', error);
//       throw new Error('Failed to fetch category icons');
//     }
//   }

//   async getSubCategoryIcons() {
//     const cacheKey = 'subcategory-icons';
//     let cachedIcons = cache.get(cacheKey);
    
//     if (cachedIcons) {
//       return cachedIcons;
//     }

//     try {
//       const response = await axios.get(`${this.iconApiUrl}/subcategories/icons`, {
//         headers: {
//           'Authorization': `Bearer ${this.apiKey}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       const icons = response.data;
//       cache.put(cacheKey, icons, this.cacheTimeout);
//       return icons;
//     } catch (error) {
//       console.error('Error fetching subcategory icons:', error);
//       throw new Error('Failed to fetch subcategory icons');
//     }
//   }

//   async getPurchasedIcons(userId) {
//     try {
//       const response = await axios.get(`${this.iconApiUrl}/users/${userId}/purchased-icons`, {
//         headers: {
//           'Authorization': `Bearer ${this.apiKey}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching purchased icons:', error);
//       throw new Error('Failed to fetch purchased icons');
//     }
//   }

//   async purchaseIcon(userId, iconId) {
//     try {
//       const response = await axios.post(`${this.iconApiUrl}/purchase`, {
//         userId,
//         iconId
//       }, {
//         headers: {
//           'Authorization': `Bearer ${this.apiKey}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       return response.data;
//     } catch (error) {
//       console.error('Error purchasing icon:', error);
//       throw new Error('Failed to purchase icon');
//     }
//   }
// }

// module.exports = new IconService();