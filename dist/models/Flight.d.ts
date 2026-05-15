import mongoose, { Document } from 'mongoose';
export interface IFlight extends Document {
    flightNumber: string;
    airline: string;
    origin: {
        iataCode: string;
        city: string;
        country: string;
        terminal?: string;
    };
    destination: {
        iataCode: string;
        city: string;
        country: string;
        terminal?: string;
    };
    departureTime: Date;
    arrivalTime: Date;
    duration: number;
    stops: number;
    aircraft: string;
    status: 'scheduled' | 'delayed' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
    cabinClasses: Array<{
        type: 'economy' | 'business' | 'first';
        totalSeats: number;
        availableSeats: number;
        baseFare: number;
        currency: string;
    }>;
    amenities: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Flight: mongoose.Model<IFlight, {}, {}, {}, mongoose.Document<unknown, {}, IFlight, {}, {}> & IFlight & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Flight.d.ts.map