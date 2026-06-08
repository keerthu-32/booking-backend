import mongoose, { Schema, Document, Types } from 'mongoose';

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

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['card', 'wallet', 'bank_transfer'],
      required: true,
    },
    provider: {
      type: String,
      enum: ['stripe', 'razorpay'],
      required: true,
    },
    providerTransactionId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    refundAmount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
