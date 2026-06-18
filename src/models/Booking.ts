import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  bookingReference: string;
  userId: Types.ObjectId;
  flightId: Types.ObjectId;
  passengers: Array<{
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    passportNumber?: string;
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

const bookingSchema = new Schema<IBooking>(
  {
    bookingReference: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    flightId: { type: Schema.Types.ObjectId, ref: 'Flight', required: true },
    passengers: [
      {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        dateOfBirth: { type: Date, required: true },
        passportNumber: { type: String },
        nationality: { type: String, required: true },
        seatNumber: { type: String, required: true },
        mealPreference: { type: String },
      },
    ],
    cabinClass: {
      type: String,
      enum: ['economy', 'business', 'first'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    fareBreakdown: {
      baseFare: { type: Number, required: true },
      taxes: { type: Number, required: true },
      fees: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    checkInStatus: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
