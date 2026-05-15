import mongoose, { Document, Types } from 'mongoose';
export interface IBooking extends Document {
    bookingReference: string;
    userId: Types.ObjectId;
    flightId: Types.ObjectId;
    passengers: Array<{
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
        passportNumber: string;
        nationality: string;
        seatNumber: string;
        mealPreference?: string;
    }>;
    cabinClass: 'economy' | 'business' | 'first';
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    fareBreakdown: {
        baseFare: number;
        taxes: number;
        fees: number;
        totalAmount: number;
        currency: string;
    };
    paymentId?: Types.ObjectId;
    checkInStatus: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Booking: mongoose.Model<IBooking, {}, {}, {}, mongoose.Document<unknown, {}, IBooking, {}, {}> & IBooking & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Booking.d.ts.map