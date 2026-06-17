import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { catchAsync } from '../utils/catchAsync';
import { initiatePaymentSchema, confirmPaymentSchema } from '../validators';
import { ValidationError } from '../utils/errors';

export const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new ValidationError('User not authenticated');
  }

  const validatedData = initiatePaymentSchema.safeParse(req.body);
  if (!validatedData.success) {
    const errors = validatedData.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }

  const result = await paymentService.initiatePayment(req.userId, validatedData.data);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Payment initiated successfully',
    data: result,
  });
});

export const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new ValidationError('User not authenticated');
  }

  const validatedData = confirmPaymentSchema.safeParse(req.body);
  if (!validatedData.success) {
    const errors = validatedData.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }

  const payment = await paymentService.confirmPayment(
    validatedData.data.paymentIntentId,
    validatedData.data.orderId,
    validatedData.data.razorpaySignature
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Payment confirmed successfully',
    data: payment,
  });
});

export const webhook = catchAsync(async (req: Request, res: Response) => {
  // Razorpay webhook — currently a stub. Full implementation should verify
  // the X-Razorpay-Signature header and process the event payload.
  res.status(200).json({ success: true, message: 'Webhook received' });
});

export const requestRefund = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new ValidationError('User not authenticated');
  }

  const payment = await paymentService.requestRefund(req.params.bookingId, req.userId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Refund processed successfully',
    data: payment,
  });
});

export const getPaymentDetails = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new ValidationError('User not authenticated');
  }

  const payment = await paymentService.getPaymentDetails(req.params.bookingId, req.userId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Payment details retrieved successfully',
    data: payment,
  });
});
