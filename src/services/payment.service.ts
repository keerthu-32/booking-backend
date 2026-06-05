import { Payment, IPayment } from '../models/Payment';
import { Booking } from '../models/Booking';
import { Notification } from '../models/Notification';
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
      throw new ValidationError('Stripe payments are not configured for this deployment');
    }

    if (booking.status !== 'pending') {
      throw new ValidationError('Only pending bookings can be paid');
    }

    // Create Razorpay order (amount in paise = USD cents equivalent for testing)
    const order = await getRazorpay().orders.create({
      amount: Math.round(booking.fareBreakdown.totalAmount * 100),
      currency: 'INR', // Razorpay test supports INR
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

  async confirmPayment(paymentIntentId: string): Promise<IPayment> {
    // Find payment by provider transaction ID
    const payment = await Payment.findOne({
      providerTransactionId: paymentIntentId,
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Update payment status to success
    payment.status = 'success';
    await payment.save();

    // Update booking status to confirmed
    const booking = await Booking.findByIdAndUpdate(
      payment.bookingId,
      { status: 'confirmed' },
      { new: true }
    );

    if (booking) {
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
    // Razorpay webhook handling can be added here
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

    // Mark as refunded (Razorpay refund API can be added later)
    payment.status = 'refunded';
    payment.refundAmount = booking.fareBreakdown.totalAmount;
    await payment.save();

    return payment;
  }

  async getPaymentDetails(bookingId: string, userId: string): Promise<IPayment> {
    // Verify booking belongs to user
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
