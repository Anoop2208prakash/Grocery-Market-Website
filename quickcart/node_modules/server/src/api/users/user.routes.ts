import express from 'express';
import { getUserProfile, updateUserProfile } from './user.controller';
import { protect } from '../auth/auth.middleware';

const router = express.Router();

// All routes here are protected
router.use(protect);

router.route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

export default router;