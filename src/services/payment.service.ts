import { Payment, IPayment } from '../models/Payment';
import { Booking } from '../models/Booking';
import { NotFoundError, ValidationError } from '../utils/errors';
import { createPaymentIntent, refundPayment, verifyWebhookSignature } from '../integrations/stripe';

export interface InitiatePaymentData {
  bookingId: string;
  paymentMethod: 'card' | 'wallet' | 'bank_transfer';
  provider: 'stripe' | 'razorpay';
}

export class PaymentService {
  async initiatePayment(
    userId: string,
    data: InitiatePaymentData
  ): Promise<{ clientSecret: string; paymentIntentId: string; amount: number; currency: string }> {
    // Find booking
    const booking = await Booking.findById(data.bookingId).populate('userId');
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.userId.toString() !== userId) {
      throw new ValidationError('Booking does not belong to this user');
    }

    if (booking.status !== 'pending') {
      throw new ValidationError('Only pending bookings can be paid');
    }

    // Create payment intent with Stripe
    const stripeIntent = await createPaymentIntent({
      amount: Math.round(booking.fareBreakdown.totalAmount * 100), // Convert to cents
      currency: booking.fareBreakdown.currency,
      customerEmail: (booking.userId as any).email,
      description: `Flight Booking - ${booking.bookingReference}`,
      metadata: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
      },
    });

    // Create payment record in DB
    const payment = new Payment({
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

    return payment;
  }

  async handleWebhookPayment(signatureOrEvent: string, rawBody: any): Promise<any> {
    // Verify signature and construct event using stripe helper
    const event = verifyWebhookSignature(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody), signatureOrEvent);
    if (!event) throw new ValidationError('Invalid webhook signature');

    const paymentIntentId = event.data.object.id;

    const payment = await Payment.findOne({
      providerTransactionId: paymentIntentId,
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (event.type === 'payment_intent.succeeded') {
      payment.status = 'success';

      // Update booking status
      await Booking.findByIdAndUpdate(payment.bookingId, { status: 'confirmed' });
    } else if (event.type === 'payment_intent.payment_failed') {
      payment.status = 'failed';
    }

    await payment.save();
    return event;
  }

  async requestRefund(bookingId: string, userId: string): Promise<IPayment> {
    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.userId.toString() !== userId) {
      throw new ValidationError('Booking does not belong to this user');
    }

    // Find payment
    const payment = await Payment.findOne({ bookingId });
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status === 'refunded') {
      throw new ValidationError('Payment already refunded');
    }

    // Process refund with Stripe
    const refund = await refundPayment(payment.providerTransactionId);

    // Update payment record
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
