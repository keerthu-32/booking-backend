import { z } from 'zod';

// Auth Validators
export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'Invalid phone number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// User Validators
export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  passportNumber: z.string().optional(),
  nationality: z.string().optional(),
  preferences: z
    .object({
      seatPreference: z.enum(['window', 'middle', 'aisle']).optional(),
      mealPreference: z.string().optional(),
      newsletterOptIn: z.boolean().optional(),
    })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
});

// Flight Validators
export const flightSearchSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  passengers: z.coerce.number().int().min(1, 'At least 1 passenger required').default(1),
  cabinClass: z.enum(['economy', 'business', 'first']).optional(),
  sortBy: z.enum(['price', 'duration', 'departure']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// Booking Validators
export const createBookingSchema = z.object({
  flightId: z.string().min(1, 'Flight ID is required'),
  cabinClass: z.enum(['economy', 'business', 'first']),
  passengers: z.array(
    z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
      passportNumber: z.string().min(1, 'Passport number is required'),
      nationality: z.string().min(1, 'Nationality is required'),
      seatNumber: z.string().min(1, 'Seat number is required'),
      mealPreference: z.string().optional(),
    })
  ),
});

// Payment Validators
export const initiatePaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  paymentMethod: z.enum(['card', 'wallet', 'bank_transfer']),
  provider: z.enum(['stripe', 'razorpay']),
});

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
});
