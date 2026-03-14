import express from 'express';
import * as salesController from '../controllers/salesController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', salesController.getSales);
router.get('/:id', salesController.getSale);
router.post('/', salesController.createSale);
router.post('/:id/payments', salesController.addPayment);

export default router;
