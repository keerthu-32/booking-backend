import { IBooking } from '../models/Booking';
export interface PassengerData {
    firstName: string;
    lastName: string;
    dateOfBirth: string | Date;
    passportNumber: string;
    nationality: string;
    seatNumber: string;
    mealPreference?: string;
}
export interface CreateBookingData {
    flightId: string;
    cabinClass: 'economy' | 'business' | 'first';
    passengers: PassengerData[];
}
export declare class BookingService {
    createBooking(userId: string, data: CreateBookingData): Promise<IBooking>;
    getBooking(bookingId: string, userId?: string): Promise<IBooking>;
    getUserBookings(userId: string): Promise<IBooking[]>;
    cancelBooking(bookingId: string, userId: string): Promise<IBooking>;
    updateBookingStatus(bookingId: string, status: string): Promise<IBooking>;
}
export declare const bookingService: BookingService;
//# sourceMappingURL=booking.service.d.ts.map