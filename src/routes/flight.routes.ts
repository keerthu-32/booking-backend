import { Router } from 'express';
import * as flightController from '../controllers/flight.controller';
import { authenticateToken, authorizeRole, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/airports', flightController.getAirports);
router.get('/search', optionalAuth, flightController.searchFlights);
router.get('/:id', optionalAuth, flightController.getFlightDetails);
router.get('/:id/seats', optionalAuth, flightController.getSeatAvailability);

// Admin routes
router.post('/', authenticateToken, authorizeRole('admin'), flightController.createFlight);
router.put('/:id', authenticateToken, authorizeRole('admin'), flightController.updateFlight);
router.delete('/:id', authenticateToken, authorizeRole('admin'), flightController.deleteFlight);

export default router;
