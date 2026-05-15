import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Private routes
router.post('/initiate', authenticateToken, paymentController.initiatePayment);
router.post('/confirm', authenticateToken, paymentController.confirmPayment);
router.post('/refund/:bookingId', authenticateToken, paymentController.requestRefund);
router.get('/:bookingId', authenticateToken, paymentController.getPaymentDetails);

// Public webhook (unsigned)
router.post('/webhook', paymentController.webhook);

export default router;
