import express from 'express';
import { checkLocation } from './location.controller';

const router = express.Router();

router.post('/check', checkLocation);

export default router;