import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { catchAsync } from '../utils/catchAsync';
import { initiatePaymentSchema, confirmPaymentSchema } from '../validators';
import { ValidationError } from '../utils/errors';
import { verifyWebhookSignature } from '../integrations/stripe';

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

  const payment = await paymentService.confirmPayment(validatedData.data.paymentIntentId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Payment confirmed successfully',
    data: payment,
  });
});

export const webhook = catchAsync(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    throw new ValidationError('Missing Stripe signature');
  }

  const body = (req as any).rawBody || JSON.stringify(req.body);
  const event = verifyWebhookSignature(body, sig);

  if (!event) {
    throw new ValidationError('Invalid webhook signature');
  }

  // Handle webhook event (pass signature + raw body for verification)
  await paymentService.handleWebhookPayment(sig, body);

  res.status(200).json({
    success: true,
    message: 'Webhook processed successfully',
  });
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
