import { IPayment } from '../models/Payment';
export interface InitiatePaymentData {
    bookingId: string;
    paymentMethod: 'card' | 'wallet' | 'bank_transfer';
    provider: 'stripe' | 'razorpay';
}
export declare class PaymentService {
    initiatePayment(userId: string, data: InitiatePaymentData): Promise<{
        clientSecret: string;
        paymentIntentId: string;
        amount: number;
        currency: string;
    }>;
    confirmPayment(paymentIntentId: string): Promise<IPayment>;
    handleWebhookPayment(signatureOrEvent: string, rawBody: any): Promise<any>;
    requestRefund(bookingId: string, userId: string): Promise<IPayment>;
    getPaymentDetails(bookingId: string, userId: string): Promise<IPayment>;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=payment.service.d.ts.map