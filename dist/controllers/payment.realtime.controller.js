"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentDetails = exports.requestRefund = exports.handleWebhook = exports.confirmPayment = exports.initiatePayment = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const Payment_1 = require("../models/Payment");
const Booking_1 = require("../models/Booking");
const payment_service_1 = require("../services/payment.service");
const errors_1 = require("../utils/errors");
const validators_1 = require("../validators");
const paymentService = new payment_service_1.PaymentService();
/**
 * Initiate payment for a booking
 * POST /api/v1/payments/initiate
 */
exports.initiatePayment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const realtimeEvents = req.app.locals.realtimeEvents;
    const userId = req.user?.userId;
    if (!userId) {
        throw new errors_1.UnauthorizedError('User not authenticated');
    }
    const validatedData = validators_1.initiatePaymentSchema.parse(req.body);
    // Verify booking exists and belongs to user
    const booking = await Booking_1.Booking.findById(validatedData.bookingId);
    if (!booking) {
        throw new errors_1.NotFoundError('Booking not found');
    }
    if (booking.userId.toString() !== userId) {
        throw new errors_1.UnauthorizedError('You do not have permission to pay for this booking');
    }
    // Initiate payment
    const payment = await paymentService.initiatePayment(userId, validatedData);
    // Emit real-time event - payment initiated
    if (realtimeEvents) {
        realtimeEvents.getRealtimeService().notifyUser(userId, 'payment_initiated', {
            bookingId: validatedData.bookingId,
            amount: booking.fareBreakdown.totalAmount,
            currency: booking.fareBreakdown.currency,
            provider: validatedData.provider,
        });
    }
    res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Payment initiated successfully',
        data: payment,
    });
});
/**
 * Confirm payment
 * POST /api/v1/payments/confirm
 */
exports.confirmPayment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const realtimeEvents = req.app.locals.realtimeEvents;
    const userId = req.user?.userId;
    if (!userId) {
        throw new errors_1.UnauthorizedError('User not authenticated');
    }
    const validatedData = validators_1.confirmPaymentSchema.parse(req.body);
    try {
        // Confirm payment
        const payment = await paymentService.confirmPayment(validatedData.paymentIntentId);
        // Get booking info
        const booking = await Booking_1.Booking.findById(payment.bookingId);
        if (!booking) {
            throw new errors_1.NotFoundError('Associated booking not found');
        }
        // Emit real-time events
        if (realtimeEvents) {
            // Payment confirmation notification
            await realtimeEvents.emitPaymentSuccess(booking._id.toString(), userId, booking.fareBreakdown.totalAmount, booking.fareBreakdown.currency);
            // Broadcast seat update to flight viewers
            const flight = await booking.populate('flightId');
            if (flight && flight.flightId) {
                const cabinInfo = flight.flightId.cabinClasses.find((c) => c.type === booking.cabinClass);
                if (cabinInfo) {
                    realtimeEvents.getRealtimeService().broadcastSeatUpdate(booking.flightId.toString(), booking.cabinClass, cabinInfo.availableSeats, cabinInfo.totalSeats);
                }
            }
        }
        res.json({
            success: true,
            statusCode: 200,
            message: 'Payment confirmed successfully',
            data: payment,
        });
    }
    catch (error) {
        // Emit payment failure event
        if (realtimeEvents) {
            realtimeEvents.emitPaymentFailure(req.body.bookingId || '', userId, error instanceof Error ? error.message : 'Payment confirmation failed');
        }
        throw error;
    }
});
/**
 * Handle Stripe webhook
 * POST /api/v1/payments/webhook
 */
exports.handleWebhook = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const realtimeEvents = req.app.locals.realtimeEvents;
    const sig = req.headers['stripe-signature'];
    try {
        const event = await paymentService.handleWebhookPayment(sig, req.body);
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            // Update payment in database
            const payment = await Payment_1.Payment.findOne({ providerTransactionId: paymentIntent.id });
            if (payment) {
                // Update booking status
                const booking = await Booking_1.Booking.findByIdAndUpdate(payment.bookingId, { status: 'confirmed' }, { new: true });
                // Emit real-time success event
                if (realtimeEvents && booking) {
                    await realtimeEvents.emitPaymentSuccess(booking._id.toString(), booking.userId.toString(), payment.amount, payment.currency);
                }
            }
        }
        else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            // Update payment in database
            const payment = await Payment_1.Payment.findOne({ providerTransactionId: paymentIntent.id });
            if (payment) {
                payment.status = 'failed';
                await payment.save();
                // Emit real-time failure event
                if (realtimeEvents) {
                    realtimeEvents.emitPaymentFailure(payment.bookingId.toString(), payment.userId.toString(), 'Payment failed - insufficient funds or card declined');
                }
            }
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: 'Webhook processing failed' });
    }
});
/**
 * Request refund
 * POST /api/v1/payments/refund/:bookingId
 */
exports.requestRefund = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const realtimeEvents = req.app.locals.realtimeEvents;
    const { bookingId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        throw new errors_1.UnauthorizedError('User not authenticated');
    }
    // Verify booking ownership
    const booking = await Booking_1.Booking.findById(bookingId);
    if (!booking) {
        throw new errors_1.NotFoundError('Booking not found');
    }
    if (booking.userId.toString() !== userId) {
        throw new errors_1.UnauthorizedError('You do not have permission to request refund for this booking');
    }
    // Process refund
    const refundResult = await paymentService.requestRefund(bookingId, userId);
    // Emit real-time refund event
    if (realtimeEvents) {
        await realtimeEvents.emitRefundProcessed(bookingId, userId, refundResult.refundAmount, booking.fareBreakdown.currency);
    }
    res.json({
        success: true,
        statusCode: 200,
        message: 'Refund requested successfully',
        data: refundResult,
    });
});
/**
 * Get payment details
 * GET /api/v1/payments/:bookingId
 */
exports.getPaymentDetails = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        throw new errors_1.UnauthorizedError('User not authenticated');
    }
    // Verify booking ownership
    const booking = await Booking_1.Booking.findById(bookingId);
    if (!booking) {
        throw new errors_1.NotFoundError('Booking not found');
    }
    if (booking.userId.toString() !== userId && req.user?.role !== 'admin') {
        throw new errors_1.UnauthorizedError('You do not have permission to view this payment');
    }
    // Get payment details
    const paymentDetails = await paymentService.getPaymentDetails(bookingId, userId);
    res.json({
        success: true,
        statusCode: 200,
        message: 'Payment details retrieved successfully',
        data: paymentDetails,
    });
});
exports.default = {
    initiatePayment: exports.initiatePayment,
    confirmPayment: exports.confirmPayment,
    handleWebhook: exports.handleWebhook,
    requestRefund: exports.requestRefund,
    getPaymentDetails: exports.getPaymentDetails,
};
//# sourceMappingURL=payment.realtime.controller.js.map