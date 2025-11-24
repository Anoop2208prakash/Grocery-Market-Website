import express from 'express';
import { 
  validateCoupon, 
  createCoupon, 
  getCoupons,   // <-- Ensure this is imported
  deleteCoupon  // <-- Ensure this is imported
} from './coupon.controller';
import { protect, admin } from '../auth/auth.middleware';

const router = express.Router();

// Public/User Route to check coupon
router.post('/validate', protect, validateCoupon);

// Admin Routes
router.get('/', protect, admin, getCoupons);       // <-- THIS WAS LIKELY MISSING
router.post('/', protect, admin, createCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

export default router;