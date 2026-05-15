"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBookings = exports.cancelBooking = exports.getUserBookings = exports.getBooking = exports.createBooking = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const Booking_1 = require("../models/Booking");
const booking_service_1 = require("../services/booking.service");
const errors_1 = require("../utils/errors");
const validators_1 = require("../validators");
const bookingService = new booking_service_1.BookingService();
/**
 * Create a new booking
 * POST /api/v1/bookings
 */
exports.createBooking = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const realtimeEvents = req.app.locals.realtimeEvents;
    const userId = req.user?.userId;
    if (!userId) {
        throw new errors_1.UnauthorizedError('User not authenticated');
    }
    // Validate request body
    const validatedData = validators_1.createBookingSchema.parse(req.body);
    // Create booking
    const booking = await bookingService.createBooking(userId, validatedData);
    // Emit real-time event for booking created
    if (realtimeEvents) {
        await realtimeEvents.emitBookingCreated(booking._id.toString(), validatedData.flightId, userId, validatedData.cabinClass);
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
exports.getBooking = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        throw new errors_1.UnauthorizedError('User not authenticated');
    }
    const booking = await Booking_1.Booking.findById(id)
        .populate('userId', 'email firstName lastName')
        .populate('flightId');
    if (!booking) {
        throw new errors_1.NotFoundError('Booking not found');
    }
    // Check ownership
    if (booking.userId.toString() !== userId && req.user?.role !== 'admin') {
        throw new errors_1.UnauthorizedError('You do not have permission to view this booking');
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
exports.getUserBookings = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new errors_1.UnauthorizedError('User not authenticated');
    }
    const bookings = await Booking_1.Booking.find({ userId })
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
exports.cancelBooking = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const realtimeEvents = req.app.locals.realtimeEvents;
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        throw new errors_1.UnauthorizedError('User not authenticated');
    }
    // Check booking exists and ownership
    const booking = await Booking_1.Booking.findById(id).populate('flightId');
    if (!booking) {
        throw new errors_1.NotFoundError('Booking not found');
    }
    if (booking.userId.toString() !== userId) {
        throw new errors_1.UnauthorizedError('You do not have permission to cancel this booking');
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
exports.getAllBookings = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (req.user?.role !== 'admin') {
        throw new errors_1.UnauthorizedError('Admin access required');
    }
    const bookings = await Booking_1.Booking.find()
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
exports.default = {
    createBooking: exports.createBooking,
    getBooking: exports.getBooking,
    getUserBookings: exports.getUserBookings,
    cancelBooking: exports.cancelBooking,
    getAllBookings: exports.getAllBookings,
};
//# sourceMappingURL=booking.realtime.controller.js.map