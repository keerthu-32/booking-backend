import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

// Public homepage insights
router.get('/insights', bookingController.getHomepageInsights);

// Public route for checking occupied seats (needed during booking)
router.get('/flights/:flightId/occupied-seats', bookingController.getOccupiedSeats);

// Admin routes
router.get('/admin/all', authenticateToken, authorizeRole('admin'), bookingController.getAllBookings);
router.get('/admin/analytics', authenticateToken, authorizeRole('admin'), bookingController.getAnalytics);

// Private routes
router.post('/', authenticateToken, bookingController.createBooking);
router.get('/', authenticateToken, bookingController.getUserBookings);
router.get('/:id', authenticateToken, bookingController.getBooking);
router.put('/:id/cancel', authenticateToken, bookingController.cancelBooking);

export default router;
