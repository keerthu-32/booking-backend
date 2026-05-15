import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
}, {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const updateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    passportNumber: z.ZodOptional<z.ZodString>;
    nationality: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodObject<{
        seatPreference: z.ZodOptional<z.ZodEnum<["window", "middle", "aisle"]>>;
        mealPreference: z.ZodOptional<z.ZodString>;
        newsletterOptIn: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        seatPreference?: "window" | "middle" | "aisle" | undefined;
        mealPreference?: string | undefined;
        newsletterOptIn?: boolean | undefined;
    }, {
        seatPreference?: "window" | "middle" | "aisle" | undefined;
        mealPreference?: string | undefined;
        newsletterOptIn?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    passportNumber?: string | undefined;
    nationality?: string | undefined;
    preferences?: {
        seatPreference?: "window" | "middle" | "aisle" | undefined;
        mealPreference?: string | undefined;
        newsletterOptIn?: boolean | undefined;
    } | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    passportNumber?: string | undefined;
    nationality?: string | undefined;
    preferences?: {
        seatPreference?: "window" | "middle" | "aisle" | undefined;
        mealPreference?: string | undefined;
        newsletterOptIn?: boolean | undefined;
    } | undefined;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>;
export declare const flightSearchSchema: z.ZodObject<{
    origin: z.ZodString;
    destination: z.ZodString;
    departureDate: z.ZodString;
    returnDate: z.ZodOptional<z.ZodString>;
    passengers: z.ZodDefault<z.ZodNumber>;
    cabinClass: z.ZodOptional<z.ZodEnum<["economy", "business", "first"]>>;
    sortBy: z.ZodOptional<z.ZodEnum<["price", "duration", "departure"]>>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    origin: string;
    destination: string;
    departureDate: string;
    passengers: number;
    page: number;
    returnDate?: string | undefined;
    cabinClass?: "economy" | "business" | "first" | undefined;
    sortBy?: "price" | "duration" | "departure" | undefined;
    order?: "asc" | "desc" | undefined;
}, {
    origin: string;
    destination: string;
    departureDate: string;
    limit?: number | undefined;
    returnDate?: string | undefined;
    passengers?: number | undefined;
    cabinClass?: "economy" | "business" | "first" | undefined;
    sortBy?: "price" | "duration" | "departure" | undefined;
    order?: "asc" | "desc" | undefined;
    page?: number | undefined;
}>;
export declare const createBookingSchema: z.ZodObject<{
    flightId: z.ZodString;
    cabinClass: z.ZodEnum<["economy", "business", "first"]>;
    passengers: z.ZodArray<z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        dateOfBirth: z.ZodString;
        passportNumber: z.ZodString;
        nationality: z.ZodString;
        seatNumber: z.ZodString;
        mealPreference: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        passportNumber: string;
        nationality: string;
        seatNumber: string;
        mealPreference?: string | undefined;
    }, {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        passportNumber: string;
        nationality: string;
        seatNumber: string;
        mealPreference?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    passengers: {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        passportNumber: string;
        nationality: string;
        seatNumber: string;
        mealPreference?: string | undefined;
    }[];
    cabinClass: "economy" | "business" | "first";
    flightId: string;
}, {
    passengers: {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        passportNumber: string;
        nationality: string;
        seatNumber: string;
        mealPreference?: string | undefined;
    }[];
    cabinClass: "economy" | "business" | "first";
    flightId: string;
}>;
export declare const initiatePaymentSchema: z.ZodObject<{
    bookingId: z.ZodString;
    paymentMethod: z.ZodEnum<["card", "wallet", "bank_transfer"]>;
    provider: z.ZodEnum<["stripe", "razorpay"]>;
}, "strip", z.ZodTypeAny, {
    bookingId: string;
    paymentMethod: "card" | "wallet" | "bank_transfer";
    provider: "stripe" | "razorpay";
}, {
    bookingId: string;
    paymentMethod: "card" | "wallet" | "bank_transfer";
    provider: "stripe" | "razorpay";
}>;
export declare const confirmPaymentSchema: z.ZodObject<{
    paymentIntentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    paymentIntentId: string;
}, {
    paymentIntentId: string;
}>;
//# sourceMappingURL=index.d.ts.map