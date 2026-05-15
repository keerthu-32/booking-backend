import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

// Private routes
router.post('/', authenticateToken, bookingController.createBooking);
router.get('/', authenticateToken, bookingController.getUserBookings);
router.get('/:id', authenticateToken, bookingController.getBooking);
router.put('/:id/cancel', authenticateToken, bookingController.cancelBooking);

// Admin routes
router.get('/admin/all', authenticateToken, authorizeRole('admin'), bookingController.getAllBookings);

export default router;
