import crypto from 'crypto';

export const generateBookingReference = (): string => {
  const prefix = 'FB';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const calculateRefundAmount = (totalAmount: number, departureDate: Date): number => {
  const now = new Date();
  const timeDifference = departureDate.getTime() - now.getTime();
  const hoursDifference = timeDifference / (1000 * 60 * 60);

  if (hoursDifference > 48) {
    return totalAmount; // 100% refund
  } else if (hoursDifference > 24) {
    return totalAmount * 0.75; // 75% refund
  } else {
    return 0; // No refund
  }
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password: string): boolean => {
  // At least 8 chars, 1 uppercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const maskCardNumber = (cardNumber: string): string => {
  return `****-****-****-${cardNumber.slice(-4)}`;
};
