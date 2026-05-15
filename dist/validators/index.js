"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPaymentSchema = exports.initiatePaymentSchema = exports.createBookingSchema = exports.flightSearchSchema = exports.changePasswordSchema = exports.updateUserSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Auth Validators
exports.registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    phone: zod_1.z.string().min(10, 'Invalid phone number'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
// User Validators
exports.updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().datetime().optional(),
    passportNumber: zod_1.z.string().optional(),
    nationality: zod_1.z.string().optional(),
    preferences: zod_1.z
        .object({
        seatPreference: zod_1.z.enum(['window', 'middle', 'aisle']).optional(),
        mealPreference: zod_1.z.string().optional(),
        newsletterOptIn: zod_1.z.boolean().optional(),
    })
        .optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: zod_1.z.string(),
});
// Flight Validators
exports.flightSearchSchema = zod_1.z.object({
    origin: zod_1.z.string().min(1, 'Origin is required'),
    destination: zod_1.z.string().min(1, 'Destination is required'),
    departureDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    returnDate: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
        .optional(),
    passengers: zod_1.z.number().int().min(1, 'At least 1 passenger required').default(1),
    cabinClass: zod_1.z.enum(['economy', 'business', 'first']).optional(),
    sortBy: zod_1.z.enum(['price', 'duration', 'departure']).optional(),
    order: zod_1.z.enum(['asc', 'desc']).optional(),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
});
// Booking Validators
exports.createBookingSchema = zod_1.z.object({
    flightId: zod_1.z.string().min(1, 'Flight ID is required'),
    cabinClass: zod_1.z.enum(['economy', 'business', 'first']),
    passengers: zod_1.z.array(zod_1.z.object({
        firstName: zod_1.z.string().min(1, 'First name is required'),
        lastName: zod_1.z.string().min(1, 'Last name is required'),
        dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
        passportNumber: zod_1.z.string().min(1, 'Passport number is required'),
        nationality: zod_1.z.string().min(1, 'Nationality is required'),
        seatNumber: zod_1.z.string().min(1, 'Seat number is required'),
        mealPreference: zod_1.z.string().optional(),
    })),
});
// Payment Validators
exports.initiatePaymentSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1, 'Booking ID is required'),
    paymentMethod: zod_1.z.enum(['card', 'wallet', 'bank_transfer']),
    provider: zod_1.z.enum(['stripe', 'razorpay']),
});
exports.confirmPaymentSchema = zod_1.z.object({
    paymentIntentId: zod_1.z.string().min(1, 'Payment intent ID is required'),
});
//# sourceMappingURL=index.js.map