import { Request, Response } from 'express';
import { Booking } from '../models/Booking';
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
    message: 'Booking created successfully. Your seats are held for 8 minutes.',
    data: {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      status: booking.status,
      fareBreakdown: booking.fareBreakdown,
      seatHoldMinutes: 8,
      expiresAt: new Date(Date.now() + 8 * 60 * 1000), // 8-minute seat hold
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

  const bookings = await Booking.find()
    .populate('userId')
    .populate('flightId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Booking.countDocuments();

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
  const { Booking, User } = require('../models');

  const [total, confirmed, cancelled, pending] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'cancelled' }),
    Booking.countDocuments({ status: 'pending' }),
  ]);

  const totalUsers = await User.countDocuments();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeUsersAgg = await Booking.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: '$userId' } },
    { $count: 'count' },
  ]);
  const activeUsers = activeUsersAgg[0]?.count || 0;

  // Total revenue from confirmed bookings
  const revenueAgg = await Booking.aggregate([
    { $match: { status: 'confirmed' } },
    { $group: { _id: null, total: { $sum: '$fareBreakdown.totalAmount' } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  const salesByMonth = (await Booking.aggregate([
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        bookings: { $sum: 1 },
        revenue: { $sum: '$fareBreakdown.totalAmount' },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
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
        bookings: 1,
        revenue: 1,
      },
    },
    { $limit: 6 },
  ])).reverse();

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

  const topUsers = await Booking.aggregate([
    {
      $group: {
        _id: '$userId',
        bookings: { $sum: 1 },
        revenue: { $sum: '$fareBreakdown.totalAmount' },
        lastBookingAt: { $max: '$createdAt' },
      },
    },
    { $sort: { bookings: -1, revenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        userId: { $toString: '$_id' },
        name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
        email: '$user.email',
        bookings: 1,
        revenue: 1,
        lastBookingAt: 1,
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
      totalUsers,
      activeUsers,
      totalRevenue,
      averageBookingValue: confirmed > 0 ? totalRevenue / confirmed : 0,
      cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
      topRoutes,
      topUsers,
      bookingsByMonth: bookingsByMonth.reverse(),
      salesByMonth,
      recentBookings: formattedRecent,
    },
  });
});

export const getHomepageInsights = catchAsync(async (_req: Request, res: Response) => {
  const { Booking, Flight } = require('../models');

  const [total, confirmed, cancelled] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'cancelled' }),
  ]);

  const totalRevenueAgg = await Booking.aggregate([
    { $match: { status: 'confirmed' } },
    { $group: { _id: null, total: { $sum: '$fareBreakdown.totalAmount' } } },
  ]);
  const totalRevenue = totalRevenueAgg[0]?.total || 0;

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
    { $sort: { count: -1, revenue: -1 } },
    { $limit: 10 }, // Fetch extra so we still have 5 after filtering dead routes
    {
      $project: {
        _id: 0,
        origin: '$_id.origin',
        destination: '$_id.destination',
        route: { $concat: ['$_id.origin', ' → ', '$_id.destination'] },
        count: 1,
        revenue: 1,
      },
    },
  ]);

  // Filter out routes that have no upcoming scheduled flights, so we never
  // show a "Popular Route" that leads to zero search results.
  const now = new Date();
  const routeChecks = await Promise.all(
    topRoutes.map(async (route: { origin: string; destination: string; route: string; count: number; revenue: number }) => {
      const activeFlight = await Flight.findOne({
        'origin.iataCode': route.origin,
        'destination.iataCode': route.destination,
        departureTime: { $gte: now },
        status: { $nin: ['cancelled'] },
      });
      return activeFlight ? route : null;
    })
  );
  const activeTopRoutes = routeChecks.filter(Boolean).slice(0, 5);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Homepage insights retrieved successfully',
    data: {
      totalBookings: total,
      totalRevenue,
      averageBookingValue: confirmed > 0 ? totalRevenue / confirmed : 0,
      cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
      topRoutes: activeTopRoutes,
      featuredRoute: activeTopRoutes[0] || null,
    },
  });
});

export const getOccupiedSeats = catchAsync(async (req: Request, res: Response) => {
  const { flightId } = req.params;

  if (!flightId) {
    throw new ValidationError('Flight ID is required');
  }

  // Exclude the calling user's own blocks so their already-selected seats
  // don't appear as blocked to themselves on the seat map
  const excludeUserId = req.userId; // undefined if unauthenticated
  const result = await bookingService.getOccupiedSeats(flightId, excludeUserId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Occupied seats retrieved successfully',
    data: {
      occupiedSeats: result.occupiedSeats,
      blockedSeats: result.blockedSeats, // seats held by other users (8-min TTL)
      seatHoldMinutes: 8,
    },
  });
});
