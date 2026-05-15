import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { catchAsync } from '../utils/catchAsync';
import { createBookingSchema } from '../validators';
import { ValidationError } from '../utils/errors';

export const createBooking = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new ValidationError('User not authenticated');
  }

  const validatedData = createBookingSchema.safeParse(req.body);
  if (!validatedData.success) {
    const errors = validatedData.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }

  const booking = await bookingService.createBooking(req.userId, validatedData.data);

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Booking created successfully',
    data: {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      status: booking.status,
      fareBreakdown: booking.fareBreakdown,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    },
  });
});

export const getBooking = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new ValidationError('User not authenticated');
  }

  const booking = await bookingService.getBooking(req.params.id, req.userId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Booking retrieved successfully',
    data: booking,
  });
});

export const getUserBookings = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new ValidationError('User not authenticated');
  }

  const bookings = await bookingService.getUserBookings(req.userId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'User bookings retrieved successfully',
    data: bookings,
  });
});

export const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new ValidationError('User not authenticated');
  }

  const booking = await bookingService.cancelBooking(req.params.id, req.userId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Booking cancelled successfully',
    data: booking,
  });
});

export const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  // This would need pagination implementation
  const bookings = await (require('../models').Booking as any)
    .find()
    .populate('userId')
    .populate('flightId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await (require('../models').Booking as any).countDocuments();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'All bookings retrieved successfully',
    data: {
      total,
      page,
      limit,
      bookings,
    },
  });
});
