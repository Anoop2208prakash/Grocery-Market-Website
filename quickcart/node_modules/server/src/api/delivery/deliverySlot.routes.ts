import express from 'express';
import { getDeliverySlots } from './deliverySlot.controller';
import { protect } from '../auth/auth.middleware';

const router = express.Router();

router.get('/', protect, getDeliverySlots);

export default router;