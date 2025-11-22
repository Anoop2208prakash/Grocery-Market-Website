import express from 'express';
import { getBanners, createBanner, deleteBanner } from './banner.controller';
import { protect, admin } from '../auth/auth.middleware';

const router = express.Router();

// Public: Get banners
router.get('/', getBanners);

// Admin: Create and Delete
router.post('/', protect, admin, createBanner);
router.delete('/:id', protect, admin, deleteBanner);

export default router;