"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBookings = exports.cancelBooking = exports.getUserBookings = exports.getBooking = exports.createBooking = void 0;
const booking_service_1 = require("../services/booking.service");
const catchAsync_1 = require("../utils/catchAsync");
const validators_1 = require("../validators");
const errors_1 = require("../utils/errors");
exports.createBooking = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.userId) {
        throw new errors_1.ValidationError('User not authenticated');
    }
    const validatedData = validators_1.createBookingSchema.safeParse(req.body);
    if (!validatedData.success) {
        const errors = validatedData.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw new errors_1.ValidationError('Validation failed', errors);
    }
    const booking = await booking_service_1.bookingService.createBooking(req.userId, validatedData.data);
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
exports.getBooking = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.userId) {
        throw new errors_1.ValidationError('User not authenticated');
    }
    const booking = await booking_service_1.bookingService.getBooking(req.params.id, req.userId);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Booking retrieved successfully',
        data: booking,
    });
});
exports.getUserBookings = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.userId) {
        throw new errors_1.ValidationError('User not authenticated');
    }
    const bookings = await booking_service_1.bookingService.getUserBookings(req.userId);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User bookings retrieved successfully',
        data: bookings,
    });
});
exports.cancelBooking = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.userId) {
        throw new errors_1.ValidationError('User not authenticated');
    }
    const booking = await booking_service_1.bookingService.cancelBooking(req.params.id, req.userId);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Booking cancelled successfully',
        data: booking,
    });
});
exports.getAllBookings = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // This would need pagination implementation
    const bookings = await require('../models').Booking
        .find()
        .populate('userId')
        .populate('flightId')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    const total = await require('../models').Booking.countDocuments();
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
//# sourceMappingURL=booking.controller.js.map