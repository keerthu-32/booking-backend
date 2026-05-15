"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const Payment_1 = require("../models/Payment");
const Booking_1 = require("../models/Booking");
const errors_1 = require("../utils/errors");
const stripe_1 = require("../integrations/stripe");
class PaymentService {
    async initiatePayment(userId, data) {
        // Find booking
        const booking = await Booking_1.Booking.findById(data.bookingId).populate('userId');
        if (!booking) {
            throw new errors_1.NotFoundError('Booking not found');
        }
        if (booking.userId.toString() !== userId) {
            throw new errors_1.ValidationError('Booking does not belong to this user');
        }
        if (booking.status !== 'pending') {
            throw new errors_1.ValidationError('Only pending bookings can be paid');
        }
        // Create payment intent with Stripe
        const stripeIntent = await (0, stripe_1.createPaymentIntent)({
            amount: Math.round(booking.fareBreakdown.totalAmount * 100), // Convert to cents
            currency: booking.fareBreakdown.currency,
            customerEmail: booking.userId.email,
            description: `Flight Booking - ${booking.bookingReference}`,
            metadata: {
                bookingId: booking._id.toString(),
                bookingReference: booking.bookingReference,
            },
        });
        // Create payment record in DB
        const payment = new Payment_1.Payment({
            bookingId: booking._id,
            userId,
            amount: booking.fareBreakdown.totalAmount,
            currency: booking.fareBreakdown.currency,
            method: data.paymentMethod,
            provider: data.provider,
            providerTransactionId: stripeIntent.id,
            status: 'pending',
            metadata: {
                paymentIntentId: stripeIntent.id,
            },
        });
        await payment.save();
        // Update booking with payment ID
        booking.paymentId = payment._id;
        await booking.save();
        return {
            clientSecret: stripeIntent.client_secret || '',
            paymentIntentId: stripeIntent.id,
            amount: booking.fareBreakdown.totalAmount,
            currency: booking.fareBreakdown.currency,
        };
    }
    async confirmPayment(paymentIntentId) {
        // Find payment by provider transaction ID
        const payment = await Payment_1.Payment.findOne({
            providerTransactionId: paymentIntentId,
        });
        if (!payment) {
            throw new errors_1.NotFoundError('Payment not found');
        }
        // Update payment status to success
        payment.status = 'success';
        await payment.save();
        // Update booking status to confirmed
        const booking = await Booking_1.Booking.findByIdAndUpdate(payment.bookingId, { status: 'confirmed' }, { new: true });
        return payment;
    }
    async handleWebhookPayment(signatureOrEvent, rawBody) {
        // Verify signature and construct event using stripe helper
        const event = (0, stripe_1.verifyWebhookSignature)(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody), signatureOrEvent);
        if (!event)
            throw new errors_1.ValidationError('Invalid webhook signature');
        const paymentIntentId = event.data.object.id;
        const payment = await Payment_1.Payment.findOne({
            providerTransactionId: paymentIntentId,
        });
        if (!payment) {
            throw new errors_1.NotFoundError('Payment not found');
        }
        if (event.type === 'payment_intent.succeeded') {
            payment.status = 'success';
            // Update booking status
            await Booking_1.Booking.findByIdAndUpdate(payment.bookingId, { status: 'confirmed' });
        }
        else if (event.type === 'payment_intent.payment_failed') {
            payment.status = 'failed';
        }
        await payment.save();
        return event;
    }
    async requestRefund(bookingId, userId) {
        // Find booking
        const booking = await Booking_1.Booking.findById(bookingId);
        if (!booking) {
            throw new errors_1.NotFoundError('Booking not found');
        }
        if (booking.userId.toString() !== userId) {
            throw new errors_1.ValidationError('Booking does not belong to this user');
        }
        // Find payment
        const payment = await Payment_1.Payment.findOne({ bookingId });
        if (!payment) {
            throw new errors_1.NotFoundError('Payment not found');
        }
        if (payment.status === 'refunded') {
            throw new errors_1.ValidationError('Payment already refunded');
        }
        // Process refund with Stripe
        const refund = await (0, stripe_1.refundPayment)(payment.providerTransactionId);
        // Update payment record
        payment.status = 'refunded';
        payment.refundAmount = booking.fareBreakdown.totalAmount;
        await payment.save();
        return payment;
    }
    async getPaymentDetails(bookingId, userId) {
        // Verify booking belongs to user
        const booking = await Booking_1.Booking.findById(bookingId);
        if (!booking || booking.userId.toString() !== userId) {
            throw new errors_1.ValidationError('Booking does not belong to this user');
        }
        const payment = await Payment_1.Payment.findOne({ bookingId });
        if (!payment) {
            throw new errors_1.NotFoundError('Payment not found');
        }
        return payment;
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map