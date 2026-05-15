"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = exports.refundPayment = exports.confirmPaymentIntent = exports.createPaymentIntent = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
if (!stripeSecretKey) {
    console.warn('⚠ STRIPE_SECRET_KEY not configured');
}
exports.stripe = new stripe_1.default(stripeSecretKey, {
    apiVersion: '2023-10-16',
});
const createPaymentIntent = async (params) => {
    const intent = await exports.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        receipt_email: params.customerEmail,
        description: params.description,
        metadata: params.metadata,
    });
    return intent;
};
exports.createPaymentIntent = createPaymentIntent;
const confirmPaymentIntent = async (paymentIntentId) => {
    const intent = await exports.stripe.paymentIntents.retrieve(paymentIntentId);
    return intent;
};
exports.confirmPaymentIntent = confirmPaymentIntent;
const refundPayment = async (paymentIntentId, amount) => {
    // Get the charge ID from the payment intent
    const intent = await exports.stripe.paymentIntents.retrieve(paymentIntentId);
    const intentAny = intent;
    if (!intentAny.charges || !intentAny.charges.data || !intentAny.charges.data[0]) {
        throw new Error('No charge found for this payment intent');
    }
    const chargeId = intentAny.charges.data[0].id;
    const refund = await exports.stripe.refunds.create({
        charge: chargeId,
        amount: amount ? Math.round(amount * 100) : undefined,
    });
    return refund;
};
exports.refundPayment = refundPayment;
const verifyWebhookSignature = (body, signature) => {
    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
        const event = exports.stripe.webhooks.constructEvent(body, signature, webhookSecret);
        return event;
    }
    catch (error) {
        console.error('Webhook signature verification failed:', error);
        return null;
    }
};
exports.verifyWebhookSignature = verifyWebhookSignature;
//# sourceMappingURL=stripe.js.map