import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { Payment } from '../models/Payment';
import { Booking } from '../models/Booking';
import { PaymentService } from '../services/payment.service';
import { RealtimeEventService } from '../realtime';
import { UnauthorizedError, NotFoundError, ConflictError } from '../utils/errors';
import { initiatePaymentSchema, confirmPaymentSchema } from '../validators';

const paymentService = new PaymentService();

/**
 * Initiate payment for a booking
 * POST /api/v1/payments/initiate
 */
export const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const realtimeEvents = req.app.locals.realtimeEvents as RealtimeEventService;
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const validatedData = initiatePaymentSchema.parse(req.body);

  // Verify booking exists and belongs to user
  const booking = await Booking.findById(validatedData.bookingId);
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.userId.toString() !== userId) {
    throw new UnauthorizedError('You do not have permission to pay for this booking');
  }

  // Initiate payment
  const payment = await paymentService.initiatePayment(userId, validatedData);

  // Emit real-time event - payment initiated
  if (realtimeEvents) {
    realtimeEvents.getRealtimeService().notifyUser(userId, 'payment_initiated', {
      bookingId: validatedData.bookingId,
      amount: booking.fareBreakdown.totalAmount,
      currency: booking.fareBreakdown.currency,
      provider: validatedData.provider,
    });
  }

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Payment initiated successfully',
    data: payment,
  });
});

/**
 * Confirm payment
 * POST /api/v1/payments/confirm
 */
export const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const realtimeEvents = req.app.locals.realtimeEvents as RealtimeEventService;
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const validatedData = confirmPaymentSchema.parse(req.body);

  try {
    const payment = await paymentService.confirmPayment(
      validatedData.paymentIntentId,
      validatedData.orderId,
      validatedData.razorpaySignature
    );

    // Get booking info
    const booking = await Booking.findById(payment.bookingId);

    if (!booking) {
      throw new NotFoundError('Associated booking not found');
    }

    // Emit real-time events
    if (realtimeEvents) {
      // Payment confirmation notification
      await realtimeEvents.emitPaymentSuccess(
        booking._id.toString(),
        userId,
        booking.fareBreakdown.totalAmount,
        booking.fareBreakdown.currency
      );

      // Broadcast seat update to flight viewers
      const flight = await booking.populate('flightId');
      if (flight && flight.flightId) {
        const cabinInfo = (flight.flightId as any).cabinClasses.find(
          (c: any) => c.type === booking.cabinClass
        );
        if (cabinInfo) {
          realtimeEvents.getRealtimeService().broadcastSeatUpdate(
            booking.flightId.toString(),
            booking.cabinClass,
            cabinInfo.availableSeats,
            cabinInfo.totalSeats
          );
        }
      }
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'Payment confirmed successfully',
      data: payment,
    });
  } catch (error) {
    // Emit payment failure event
    if (realtimeEvents) {
      realtimeEvents.emitPaymentFailure(
        req.body.bookingId || '',
        userId,
        error instanceof Error ? error.message : 'Payment confirmation failed'
      );
    }
    throw error;
  }
});

/**
 * Handle Stripe webhook
 * POST /api/v1/payments/webhook
 */
export const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const realtimeEvents = req.app.locals.realtimeEvents as RealtimeEventService;
  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = await paymentService.handleWebhookPayment(sig, req.body);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;

      // Update payment in database
      const payment = await Payment.findOne({ providerTransactionId: paymentIntent.id });
      if (payment) {
        // Update booking status
        const booking = await Booking.findByIdAndUpdate(
          payment.bookingId,
          { status: 'confirmed' },
          { new: true }
        );

        // Emit real-time success event
        if (realtimeEvents && booking) {
          await realtimeEvents.emitPaymentSuccess(
            booking._id.toString(),
            booking.userId.toString(),
            payment.amount,
            payment.currency
          );
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as any;

      // Update payment in database
      const payment = await Payment.findOne({ providerTransactionId: paymentIntent.id });
      if (payment) {
        payment.status = 'failed';
        await payment.save();

        // Emit real-time failure event
        if (realtimeEvents) {
          realtimeEvents.emitPaymentFailure(
            payment.bookingId.toString(),
            payment.userId.toString(),
            'Payment failed - insufficient funds or card declined'
          );
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Request refund
 * POST /api/v1/payments/refund/:bookingId
 */
export const requestRefund = catchAsync(async (req: Request, res: Response) => {
  const realtimeEvents = req.app.locals.realtimeEvents as RealtimeEventService;
  const { bookingId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  // Verify booking ownership
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.userId.toString() !== userId) {
    throw new UnauthorizedError('You do not have permission to request refund for this booking');
  }

  // Process refund
  const refundResult = await paymentService.requestRefund(bookingId, userId);

  // Emit real-time refund event
  if (realtimeEvents) {
    await realtimeEvents.emitRefundProcessed(
      bookingId,
      userId,
      refundResult.refundAmount,
      booking.fareBreakdown.currency
    );
  }

  res.json({
    success: true,
    statusCode: 200,
    message: 'Refund requested successfully',
    data: refundResult,
  });
});

/**
 * Get payment details
 * GET /api/v1/payments/:bookingId
 */
export const getPaymentDetails = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  // Verify booking ownership
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.userId.toString() !== userId && req.user?.role !== 'admin') {
    throw new UnauthorizedError('You do not have permission to view this payment');
  }

  // Get payment details
  const paymentDetails = await paymentService.getPaymentDetails(bookingId, userId);

  res.json({
    success: true,
    statusCode: 200,
    message: 'Payment details retrieved successfully',
    data: paymentDetails,
  });
});

export default {
  initiatePayment,
  confirmPayment,
  handleWebhook,
  requestRefund,
  getPaymentDetails,
};
