import { Request, Response } from 'express';
import { User, Booking, Flight, Notification } from '../models';
import { catchAsync } from '../utils/catchAsync';
import { ValidationError } from '../utils/errors';

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;

  const [users, total] = await Promise.all([
    User.find()
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Users retrieved successfully',
    data: { total, page, limit, users },
  });
});

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, phone, role, dateOfBirth, passportNumber, nationality } = req.body;

  if (!firstName || !lastName || !email || !password || !phone) {
    throw new ValidationError('First name, last name, email, password, and phone are required');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ValidationError('Email is already registered');
  }

  const user = new User({
    firstName,
    lastName,
    email,
    passwordHash: password,
    phone,
    role: role === 'admin' ? 'admin' : 'user',
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    passportNumber,
    nationality,
    isVerified: true,
  });

  await user.save();

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'User created successfully',
    data: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      dateOfBirth: user.dateOfBirth,
      passportNumber: user.passportNumber,
      nationality: user.nationality,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
  });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    throw new ValidationError('Role must be user or admin');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select('-passwordHash -refreshToken');

  if (!user) {
    throw new ValidationError('User not found');
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'User role updated successfully',
    data: user,
  });
});

export const getBookings = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;
  const status = req.query.status as string | undefined;
  const query = status && status !== 'all' ? { status } : {};

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('userId', 'firstName lastName email phone')
      .populate('flightId')
      .populate('paymentId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Bookings retrieved successfully',
    data: { total, page, limit, bookings },
  });
});

export const updateFlightStatus = catchAsync(async (req: Request, res: Response) => {
  const { status, departureTime, arrivalTime } = req.body;
  const validStatuses = ['scheduled', 'delayed', 'boarding', 'departed', 'arrived', 'cancelled'];

  if (status && !validStatuses.includes(status)) {
    throw new ValidationError('Invalid flight status');
  }

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (departureTime) updates.departureTime = new Date(departureTime);
  if (arrivalTime) updates.arrivalTime = new Date(arrivalTime);

  const flight = await Flight.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!flight) {
    throw new ValidationError('Flight not found');
  }

  const affectedBookings = await Booking.find({
    flightId: flight._id,
    status: { $in: ['pending', 'confirmed'] },
  }).select('userId bookingReference');

  if (affectedBookings.length > 0) {
    await Notification.insertMany(
      affectedBookings.map((booking) => ({
        userId: booking.userId,
        type: 'flight_update',
        channel: 'email',
        status: 'pending',
        payload: {
          bookingReference: booking.bookingReference,
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          flightStatus: flight.status,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
        },
      }))
    );
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Flight status updated and affected passengers queued for notification',
    data: { flight, affectedBookings: affectedBookings.length },
  });
});
