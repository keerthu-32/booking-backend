import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

const getStripeClient = (): Stripe => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  return stripeClient;
};

export interface StripePaymentIntentParams {
  amount: number; // in cents
  currency: string;
  customerEmail: string;
  description: string;
  metadata?: Record<string, string>;
}

export const createPaymentIntent = async (
  params: StripePaymentIntentParams
): Promise<any> => {
  const intent = await getStripeClient().paymentIntents.create({
    amount: params.amount,
    currency: params.currency.toLowerCase(),
    receipt_email: params.customerEmail,
    description: params.description,
    metadata: params.metadata,
  });

  return intent;
};

export const confirmPaymentIntent = async (
  paymentIntentId: string
): Promise<any> => {
  const intent = await getStripeClient().paymentIntents.retrieve(paymentIntentId);
  return intent;
};

export const refundPayment = async (
  paymentIntentId: string,
  amount?: number
): Promise<any> => {
  // Get the charge ID from the payment intent
  const intent = await getStripeClient().paymentIntents.retrieve(paymentIntentId);
  const intentAny: any = intent as any;
  if (!intentAny.charges || !intentAny.charges.data || !intentAny.charges.data[0]) {
    throw new Error('No charge found for this payment intent');
  }

  const chargeId = intentAny.charges.data[0].id;

  const refund = await getStripeClient().refunds.create({
    charge: chargeId,
    amount: amount ? Math.round(amount * 100) : undefined,
  });

  return refund;
};

export const verifyWebhookSignature = (
  body: string,
  signature: string
): any | null => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const event = getStripeClient().webhooks.constructEvent(body, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
};
