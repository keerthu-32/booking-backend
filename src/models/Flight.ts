import mongoose, { Schema, Document } from 'mongoose';

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

const flightSchema = new Schema<IFlight>(
  {
    flightNumber: { type: String, required: true, unique: true, index: true },
    airline: { type: String, required: true },
    origin: {
      iataCode: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
      terminal: { type: String },
    },
    destination: {
      iataCode: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
      terminal: { type: String },
    },
    departureTime: { type: Date, required: true, index: true },
    arrivalTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    stops: { type: Number, default: 0 },
    aircraft: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'delayed', 'boarding', 'departed', 'arrived', 'cancelled'],
      default: 'scheduled',
    },
    cabinClasses: [
      {
        type: { type: String, enum: ['economy', 'business', 'first'], required: true },
        totalSeats: { type: Number, required: true },
        availableSeats: { type: Number, required: true },
        baseFare: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
      },
    ],
    amenities: [{ type: String }],
  },
  { timestamps: true }
);

export const Flight = mongoose.model<IFlight>('Flight', flightSchema);
