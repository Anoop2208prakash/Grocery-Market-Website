import express from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductStats, // Ensure this is exported in controller
  getLowStockProducts, // Ensure this is exported in controller
  getBuyAgainProducts,
  getSearchSuggestions,
  bulkUploadProducts, 
} from './product.controller';
import { protect, admin } from '../auth/auth.middleware';
import multer from 'multer'; // Import multer for file upload

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); 

// --- Dashboard Stats Routes ---
router.route('/stats/category').get(protect, admin, getProductStats);
router.route('/stats/lowstock').get(protect, admin, getLowStockProducts);

// --- "Buy It Again" Route ---
router.route('/buy-again').get(protect, getBuyAgainProducts);

// --- Search Suggestions Route ---
router.route('/suggestions').get(getSearchSuggestions);

// --- Bulk Upload Route ---
router.route('/bulk').post(protect, admin, upload.single('csv'), bulkUploadProducts);

// GET /api/products - Get all products (Public)
// POST /api/products - Create new product (Admin)
router
  .route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

// GET /api/products/:id - Get single product (Admin)
// PUT /api/products/:id - Update a product (Admin)
// DELETE /api/products/:id - Delete a product (Admin)
router
  .route('/:id')
  .get(protect, admin, getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

export default router;