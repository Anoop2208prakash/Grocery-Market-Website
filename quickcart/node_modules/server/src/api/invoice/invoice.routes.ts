import express from 'express';
import { generateInvoice } from './invoice.controller';
import { protect } from '../auth/auth.middleware';

const router = express.Router();

// GET /api/invoice/:orderId
router.get('/:orderId', protect, generateInvoice);

export default router;