import Stripe from 'stripe';
export declare const stripe: Stripe;
export interface StripePaymentIntentParams {
    amount: number;
    currency: string;
    customerEmail: string;
    description: string;
    metadata?: Record<string, string>;
}
export declare const createPaymentIntent: (params: StripePaymentIntentParams) => Promise<any>;
export declare const confirmPaymentIntent: (paymentIntentId: string) => Promise<any>;
export declare const refundPayment: (paymentIntentId: string, amount?: number) => Promise<any>;
export declare const verifyWebhookSignature: (body: string, signature: string) => any | null;
//# sourceMappingURL=stripe.d.ts.map