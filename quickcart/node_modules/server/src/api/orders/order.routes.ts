import express from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  getRevenueStats,
  updateOrderToPaid,
  updateOrderToDelivered,
  cancelOrder,
  updateOrderStatus,
  getAvailableOrders,
} from './order.controller';
import { protect, admin } from '../auth/auth.middleware';

const router = express.Router();

// --- Public/Customer ---
router.route('/').post(protect, createOrder);
router.route('/myorders').get(protect, getMyOrders);

// --- Admin Revenue & Driver Availability ---
// Defined early to avoid conflicts with generic /:id routes
router.route('/revenue').get(protect, admin, getRevenueStats);
router.route('/available').get(protect, getAvailableOrders);

// --- Admin General ---
router.route('/').get(protect, admin, getOrders);

// --- Specific Order Operations ---
// FIXED: Moved these ABOVE the generic /:id route so they are correctly recognized
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/cancel').put(protect, cancelOrder);

// --- Single Order Fetching ---
// Generic ID routes must always come LAST
router.route('/:id').get(protect, getOrderById);

export default router;