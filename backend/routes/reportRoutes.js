import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/financial', reportController.getFinancialReport);

export default router;
