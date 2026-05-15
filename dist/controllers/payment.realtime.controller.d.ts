import { Request, Response } from 'express';
/**
 * Initiate payment for a booking
 * POST /api/v1/payments/initiate
 */
export declare const initiatePayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Confirm payment
 * POST /api/v1/payments/confirm
 */
export declare const confirmPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Handle Stripe webhook
 * POST /api/v1/payments/webhook
 */
export declare const handleWebhook: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Request refund
 * POST /api/v1/payments/refund/:bookingId
 */
export declare const requestRefund: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get payment details
 * GET /api/v1/payments/:bookingId
 */
export declare const getPaymentDetails: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const _default: {
    initiatePayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    confirmPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    handleWebhook: (req: Request, res: Response, next: import("express").NextFunction) => void;
    requestRefund: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPaymentDetails: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default _default;
//# sourceMappingURL=payment.realtime.controller.d.ts.map