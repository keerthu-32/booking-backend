import mongoose, { Document, Types } from 'mongoose';
export interface IPayment extends Document {
    bookingId: Types.ObjectId;
    userId: Types.ObjectId;
    amount: number;
    currency: string;
    method: 'card' | 'wallet' | 'bank_transfer';
    provider: 'stripe' | 'razorpay';
    providerTransactionId: string;
    status: 'pending' | 'success' | 'failed' | 'refunded';
    refundAmount: number;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Payment.d.ts.map