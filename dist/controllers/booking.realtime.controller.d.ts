import { Request, Response } from 'express';
/**
 * Create a new booking
 * POST /api/v1/bookings
 */
export declare const createBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get a single booking by ID
 * GET /api/v1/bookings/:id
 */
export declare const getBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get all bookings for logged-in user
 * GET /api/v1/bookings
 */
export declare const getUserBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Cancel a booking
 * PUT /api/v1/bookings/:id/cancel
 */
export declare const cancelBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get all bookings (Admin only)
 * GET /api/v1/bookings/admin/all
 */
export declare const getAllBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const _default: {
    createBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    cancelBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default _default;
//# sourceMappingURL=booking.realtime.controller.d.ts.map