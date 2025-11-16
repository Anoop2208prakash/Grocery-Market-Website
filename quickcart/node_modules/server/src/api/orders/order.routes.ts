import express from 'express';
import {
  getOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
  getMyOrders,
  getOrderStats,
  getOrderCountStats, // <-- 1. Import this
} from './order.controller';
import { protect, admin } from '../auth/auth.middleware';

const router = express.Router();

// POST /api/orders - Any logged-in user can create an order
// GET  /api/orders - Only admins can get all orders
router
  .route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

// --- Routes for dashboard stats ---
router.route('/stats').get(protect, admin, getOrderStats);
router.route('/stats/count').get(protect, admin, getOrderCountStats); // <-- 2. Add this route

// GET /api/orders/myorders - Get logged-in user's orders
// This MUST be before the '/:id' route
router.route('/myorders').get(protect, getMyOrders);

// GET /api/orders/:id - Get single order (Admin only)
router
  .route('/:id')
  .get(protect, admin, getOrderById);

// PUT /api/orders/:id/status - Update order status (Admin only)
router
  .route('/:id/status')
  .put(protect, admin, updateOrderStatus);

export default router;