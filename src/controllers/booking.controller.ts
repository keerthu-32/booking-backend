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

export const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { Booking } = require('../models');

  const [total, confirmed, cancelled, pending] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'cancelled' }),
    Booking.countDocuments({ status: 'pending' }),
  ]);

  // Total revenue from confirmed bookings
  const revenueAgg = await Booking.aggregate([
    { $match: { status: 'confirmed' } },
    { $group: { _id: null, total: { $sum: '$fareBreakdown.totalAmount' } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  // Top routes
  const topRoutes = await Booking.aggregate([
    { $lookup: { from: 'flights', localField: 'flightId', foreignField: '_id', as: 'flight' } },
    { $unwind: '$flight' },
    {
      $group: {
        _id: { origin: '$flight.origin.iataCode', destination: '$flight.destination.iataCode' },
        count: { $sum: 1 },
        revenue: { $sum: '$fareBreakdown.totalAmount' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 0,
        route: { $concat: ['$_id.origin', ' → ', '$_id.destination'] },
        count: 1,
        revenue: 1,
      },
    },
  ]);

  // Bookings by month (last 6 months)
  const bookingsByMonth = await Booking.aggregate([
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$fareBreakdown.totalAmount' },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 6 },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $arrayElemAt: [['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], '$_id.month'] },
            ' ',
            { $toString: '$_id.year' },
          ],
        },
        count: 1,
        revenue: 1,
      },
    },
  ]);

  // Recent bookings
  const recentBookings = await Booking.find()
    .populate('flightId', 'origin destination')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const formattedRecent = recentBookings.map((b: any) => ({
    bookingReference: b.bookingReference,
    route: b.flightId
      ? `${b.flightId.origin?.iataCode} → ${b.flightId.destination?.iataCode}`
      : 'N/A',
    status: b.status,
    amount: b.fareBreakdown?.totalAmount || 0,
    date: b.createdAt,
  }));

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Analytics retrieved successfully',
    data: {
      totalBookings: total,
      confirmedBookings: confirmed,
      cancelledBookings: cancelled,
      pendingBookings: pending,
      totalRevenue,
      averageBookingValue: confirmed > 0 ? totalRevenue / confirmed : 0,
      cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
      topRoutes,
      bookingsByMonth: bookingsByMonth.reverse(),
      recentBookings: formattedRecent,
    },
  });
});
