import express from 'express';
import {
  getOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
  getMyOrders, // <-- 1. Import this
} from './order.controller';
import { protect, admin } from '../auth/auth.middleware';

const router = express.Router();

// POST /api/orders - Any logged-in user can create an order
// GET  /api/orders - Only admins can get all orders
router
  .route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

// GET /api/orders/myorders - Get logged-in user's orders
// This MUST be before the '/:id' route
router.route('/myorders').get(protect, getMyOrders); // <-- 2. Add this route

// GET /api/orders/:id - Get single order (Admin only)
router
  .route('/:id')
  .get(protect, admin, getOrderById);

// PUT /api/orders/:id/status - Update order status (Admin only)
router
  .route('/:id/status')
  .put(protect, admin, updateOrderStatus);

export default router;