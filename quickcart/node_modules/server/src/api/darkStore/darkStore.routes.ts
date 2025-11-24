import express from 'express';
import { getDarkStores, addDarkStore, deleteDarkStore } from './darkStore.controller';
import { protect, admin } from '../auth/auth.middleware';

const router = express.Router();

router.use(protect, admin); // All routes require Admin

router.route('/')
  .get(getDarkStores)
  .post(addDarkStore);

router.route('/:id')
  .delete(deleteDarkStore);

export default router;