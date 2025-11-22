import express from 'express';
import { 
  getAvailableOrders, 
  getMyDeliveries, 
  acceptOrder, 
  completeDelivery,
  getDriverStats // <-- 1. Import this
} from './delivery.controller';
import { protect } from '../auth/auth.middleware';

const router = express.Router();

// All routes require login
router.use(protect);

router.get('/available', getAvailableOrders);
router.get('/my-deliveries', getMyDeliveries);
router.get('/stats', getDriverStats); // <-- 2. Add this route
router.post('/:orderId/accept', acceptOrder);
router.put('/:deliveryId/complete', completeDelivery);

export default router;