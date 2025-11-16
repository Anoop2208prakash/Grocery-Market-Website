import express from 'express';
import {
  getCategories,
  getCategoriesWithProducts,
  getCategoryById,
  getCategoryByName, // <-- 1. Import this
} from './category.controller';
import { protect } from '../auth/auth.middleware';

const router = express.Router();

// Route for admin panel to get category list
router.route('/').get(protect, getCategories);

// Route for the homepage to get categories with products
router.route('/products').get(getCategoriesWithProducts);

// Route for the "See All" page (using name)
router.route('/name/:name').get(getCategoryByName); // <-- 2. Add this route

// Kept this route just in case, but /name/ is preferred
router.route('/:id').get(getCategoryById);

export default router;