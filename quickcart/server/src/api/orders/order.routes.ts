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

// --- Admin Revenue ---
// FIXED: This must be defined before any /:id routes to prevent routing conflicts
router.route('/revenue').get(protect, admin, getRevenueStats);

// --- Driver Routes ---
// FIXED: This must also be before /:id
router.route('/available').get(protect, getAvailableOrders); 

// --- Admin General ---
router.route('/').get(protect, admin, getOrders);
router.route('/:id/status').put(protect, admin, updateOrderStatus);

// --- Single Order Operations ---
// These generic ID routes must always come LAST
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/cancel').put(protect, cancelOrder);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

export default router;