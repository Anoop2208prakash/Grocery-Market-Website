import express from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductStats, // <-- Now this import will work
  getLowStockProducts, // <-- Now this import will work
} from './product.controller';
import { protect, admin } from '../auth/auth.middleware';

const router = express.Router();

// --- Add routes for dashboard stats ---
router.route('/stats/category').get(protect, admin, getProductStats);
router.route('/stats/lowstock').get(protect, admin, getLowStockProducts);

// GET /api/products - Get all products (Public for customers)
// POST /api/products - Create new product (Protected for admins)
router
  .route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

// GET /api/products/:id - Get single product (Protected for admins)
// PUT /api/products/:id - Update a product (Protected for admins)
// DELETE /api/products/:id - Delete a product (Protected for admins)
router
  .route('/:id')
  .get(protect, admin, getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

export default router;