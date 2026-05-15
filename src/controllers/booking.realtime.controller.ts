import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { Booking } from '../models/Booking';
import { Flight } from '../models/Flight';
import { User } from '../models/User';
import { BookingService } from '../services/booking.service';
import { RealtimeEventService } from '../realtime';
import { ValidationError, NotFoundError, UnauthorizedError, ConflictError } from '../utils/errors';
import { createBookingSchema } from '../validators';

const bookingService = new BookingService();

/**
 * Create a new booking
 * POST /api/v1/bookings
 */
export const createBooking = catchAsync(async (req: Request, res: Response) => {
  const realtimeEvents = req.app.locals.realtimeEvents as RealtimeEventService;
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  // Validate request body
  const validatedData = createBookingSchema.parse(req.body);

  // Create booking
  const booking = await bookingService.createBooking(userId, validatedData);

  // Emit real-time event for booking created
  if (realtimeEvents) {
    await realtimeEvents.emitBookingCreated(
      booking._id.toString(),
      validatedData.flightId,
      userId,
      validatedData.cabinClass
    );
  }

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Booking created successfully',
    data: booking,
  });
});

/**
 * Get a single booking by ID
 * GET /api/v1/bookings/:id
 */
export const getBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const booking = await Booking.findById(id)
    .populate('userId', 'email firstName lastName')
    .populate('flightId');

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Check ownership
  if (booking.userId.toString() !== userId && req.user?.role !== 'admin') {
    throw new UnauthorizedError('You do not have permission to view this booking');
  }

  res.json({
    success: true,
    statusCode: 200,
    message: 'Booking retrieved successfully',
    data: booking,
  });
});

/**
 * Get all bookings for logged-in user
 * GET /api/v1/bookings
 */
export const getUserBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const bookings = await Booking.find({ userId })
    .populate('flightId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    statusCode: 200,
    message: 'User bookings retrieved successfully',
    data: bookings,
  });
});

/**
 * Cancel a booking
 * PUT /api/v1/bookings/:id/cancel
 */
export const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const realtimeEvents = req.app.locals.realtimeEvents as RealtimeEventService;
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  // Check booking exists and ownership
  const booking = await Booking.findById(id).populate('flightId');

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.userId.toString() !== userId) {
    throw new UnauthorizedError('You do not have permission to cancel this booking');
  }

  // Cancel booking
  const cancelledBooking = await bookingService.cancelBooking(id, userId);
  const refundAmount = cancelledBooking.fareBreakdown.totalAmount * 0.75; // 75% refund example

  // Emit real-time event for booking cancelled
  if (realtimeEvents) {
    await realtimeEvents.emitBookingCancelled(id, userId, refundAmount);
    await realtimeEvents.emitRefundProcessed(id, userId, refundAmount, cancelledBooking.fareBreakdown.currency);
  }

  res.json({
    success: true,
    statusCode: 200,
    message: 'Booking cancelled successfully',
    data: cancelledBooking,
  });
});

/**
 * Get all bookings (Admin only)
 * GET /api/v1/bookings/admin/all
 */
export const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    throw new UnauthorizedError('Admin access required');
  }

  const bookings = await Booking.find()
    .populate('userId', 'email firstName lastName')
    .populate('flightId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    statusCode: 200,
    message: 'All bookings retrieved successfully',
    data: bookings,
  });
});

export default {
  createBooking,
  getBooking,
  getUserBookings,
  cancelBooking,
  getAllBookings,
};
