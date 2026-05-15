"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentDetails = exports.requestRefund = exports.webhook = exports.confirmPayment = exports.initiatePayment = void 0;
const payment_service_1 = require("../services/payment.service");
const catchAsync_1 = require("../utils/catchAsync");
const validators_1 = require("../validators");
const errors_1 = require("../utils/errors");
const stripe_1 = require("../integrations/stripe");
exports.initiatePayment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.userId) {
        throw new errors_1.ValidationError('User not authenticated');
    }
    const validatedData = validators_1.initiatePaymentSchema.safeParse(req.body);
    if (!validatedData.success) {
        const errors = validatedData.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw new errors_1.ValidationError('Validation failed', errors);
    }
    const result = await payment_service_1.paymentService.initiatePayment(req.userId, validatedData.data);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Payment initiated successfully',
        data: result,
    });
});
exports.confirmPayment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.userId) {
        throw new errors_1.ValidationError('User not authenticated');
    }
    const validatedData = validators_1.confirmPaymentSchema.safeParse(req.body);
    if (!validatedData.success) {
        const errors = validatedData.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw new errors_1.ValidationError('Validation failed', errors);
    }
    const payment = await payment_service_1.paymentService.confirmPayment(validatedData.data.paymentIntentId);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Payment confirmed successfully',
        data: payment,
    });
});
exports.webhook = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        throw new errors_1.ValidationError('Missing Stripe signature');
    }
    const body = req.rawBody || JSON.stringify(req.body);
    const event = (0, stripe_1.verifyWebhookSignature)(body, sig);
    if (!event) {
        throw new errors_1.ValidationError('Invalid webhook signature');
    }
    // Handle webhook event (pass signature + raw body for verification)
    await payment_service_1.paymentService.handleWebhookPayment(sig, body);
    res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
    });
});
exports.requestRefund = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.userId) {
        throw new errors_1.ValidationError('User not authenticated');
    }
    const payment = await payment_service_1.paymentService.requestRefund(req.params.bookingId, req.userId);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Refund processed successfully',
        data: payment,
    });
});
exports.getPaymentDetails = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.userId) {
        throw new errors_1.ValidationError('User not authenticated');
    }
    const payment = await payment_service_1.paymentService.getPaymentDetails(req.params.bookingId, req.userId);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Payment details retrieved successfully',
        data: payment,
    });
});
//# sourceMappingURL=payment.controller.js.map