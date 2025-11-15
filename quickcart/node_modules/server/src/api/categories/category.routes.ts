import express from 'express';
import { getCategories } from './category.controller';
import { protect } from '../auth/auth.middleware';

const router = express.Router();
router.route('/').get(protect, getCategories); // Protect it
export default router;