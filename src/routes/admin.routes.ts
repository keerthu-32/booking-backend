import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken, authorizeRole('admin'));

router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.get('/bookings', adminController.getBookings);
router.patch('/flights/:id/status', adminController.updateFlightStatus);

export default router;
