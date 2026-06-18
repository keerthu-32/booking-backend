import crypto from 'crypto';
import { Payment, IPayment } from '../models/Payment';
import { Booking } from '../models/Booking';
import { Notification } from '../models/Notification';
import { SeatBlock } from '../models/SeatBlock';
import { NotFoundError, ValidationError } from '../utils/errors';
import Razorpay from 'razorpay';

// Lazy initialization - only create when first used, after env vars are loaded
let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }
  return razorpayInstance;
}

export interface InitiatePaymentData {
  bookingId: string;
  paymentMethod: 'card' | 'wallet' | 'bank_transfer';
  provider: 'stripe' | 'razorpay';
}

export class PaymentService {
  async initiatePayment(
    userId: string,
    data: InitiatePaymentData
  ): Promise<{ orderId: string; paymentIntentId: string; amount: number; currency: string }> {
    const booking = await Booking.findById(data.bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.userId.toString() !== userId) {
      throw new ValidationError('Booking does not belong to this user');
    }

    if (data.provider !== 'razorpay') {
      throw new ValidationError('Only Razorpay payments are configured for this deployment');
    }

    if (booking.status !== 'pending') {
      throw new ValidationError('Only pending bookings can be paid');
    }

    // Create Razorpay order. Razorpay expects INR amounts in paise.
    const order = await getRazorpay().orders.create({
      amount: Math.round(booking.fareBreakdown.totalAmount * 100),
      currency: 'INR',
      receipt: booking.bookingReference,
      notes: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
      },
    });

    // Save payment record
    const payment = new Payment({
      bookingId: booking._id,
      userId,
      amount: booking.fareBreakdown.totalAmount,
      currency: booking.fareBreakdown.currency,
      method: data.paymentMethod,
      provider: 'razorpay',
      providerTransactionId: order.id,
      status: 'pending',
      metadata: { orderId: order.id },
    });

    await payment.save();
    booking.paymentId = payment._id;
    await booking.save();

    return {
      orderId: order.id,
      paymentIntentId: order.id,
      amount: order.amount as number,
      currency: order.currency,
    };
  }

  /**
   * Confirm a Razorpay payment.
   *
   * Razorpay sends three values back to the frontend after a successful payment:
   *   - razorpay_order_id (= orderId)
   *   - razorpay_payment_id (= paymentIntentId)
   *   - razorpay_signature (= HMAC of "orderId|paymentId" signed with KEY_SECRET)
   *
   * We verify the HMAC before marking the booking confirmed. Without this check
   * any caller who knows an orderId could confirm a payment without paying.
   */
  async confirmPayment(
    paymentIntentId: string,
    orderId?: string,
    razorpaySignature?: string
  ): Promise<IPayment> {
    // --- Razorpay HMAC Signature Verification ---
    // Only enforce when the secret is configured (skip in development with no key).
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret) {
      if (!razorpaySignature || !orderId) {
        throw new ValidationError('Payment signature and order ID are required for verification.');
      }
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentIntentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        throw new ValidationError('Payment signature verification failed. Payment may be tampered.');
      }
    }

    // Find payment record by Razorpay order ID
    const payment = await Payment.findOne({
      $or: [
        { providerTransactionId: orderId || paymentIntentId },
        { 'metadata.orderId': orderId || paymentIntentId },
        { 'metadata.paymentId': paymentIntentId },
      ],
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Update payment status to success
    payment.status = 'success';
    const existingMetadata = (payment.metadata as Record<string, unknown>) || {};
    payment.metadata = {
      ...existingMetadata,
      paymentId: paymentIntentId,
      orderId: orderId || existingMetadata.orderId,
    };
    await payment.save();

    // Update booking status to confirmed
    const booking = await Booking.findByIdAndUpdate(
      payment.bookingId,
      { status: 'confirmed' },
      { new: true }
    );

    if (booking) {
      // Release the 8-minute seat blocks — the seats are now permanently booked
      const seatNumbers = booking.passengers.map((p) => p.seatNumber);
      await SeatBlock.deleteMany({
        flightId: booking.flightId,
        seatNumber: { $in: seatNumbers },
      });

      await Notification.create({
        userId: payment.userId,
        type: 'payment',
        channel: 'email',
        status: 'pending',
        payload: {
          bookingReference: booking.bookingReference,
          paymentId: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          receiptStatus: 'success',
        },
      });
    }

    return payment;
  }

  async handleWebhookPayment(signatureOrEvent: string, rawBody: any): Promise<any> {
    // Razorpay webhook handling — stub for future implementation.
    // Production: verify X-Razorpay-Signature, then call confirmPayment.
    return { received: true };
  }

  async requestRefund(bookingId: string, userId: string): Promise<IPayment> {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.userId.toString() !== userId) {
      throw new ValidationError('Booking does not belong to this user');
    }

    const payment = await Payment.findOne({ bookingId });
    if (!payment) throw new NotFoundError('Payment not found');

    if (payment.status === 'refunded') {
      throw new ValidationError('Payment already refunded');
    }

    // Mark as refunded (Razorpay refund API can be wired here)
    payment.status = 'refunded';
    payment.refundAmount = booking.fareBreakdown.totalAmount;
    await payment.save();

    return payment;
  }

  async getPaymentDetails(bookingId: string, userId: string): Promise<IPayment> {
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.userId.toString() !== userId) {
      throw new ValidationError('Booking does not belong to this user');
    }

    const payment = await Payment.findOne({ bookingId });
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  }
}

export const paymentService = new PaymentService();
