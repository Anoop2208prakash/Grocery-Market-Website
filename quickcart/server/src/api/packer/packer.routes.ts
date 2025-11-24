import express from 'express';
import { getOrdersToPack, startPacking, markReady } from './packer.controller';
import { packer, protect } from '../auth/auth.middleware';


const router = express.Router();

router.use(protect, packer);

router.get('/orders', getOrdersToPack);
router.put('/:id/start', startPacking);
router.put('/:id/ready', markReady);

export default router;