import mongoose, { Schema, Document } from 'mongoose';

export interface ISeatBlock extends Document {
  flightId: mongoose.Types.ObjectId;
  seatNumber: string;
  userId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const seatBlockSchema = new Schema<ISeatBlock>(
  {
    flightId: { type: Schema.Types.ObjectId, ref: 'Flight', required: true },
    seatNumber: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// MongoDB TTL index — automatically deletes the document when expiresAt is reached.
// expireAfterSeconds: 0 means "delete at exactly expiresAt".
seatBlockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Unique compound index: one active block per seat per flight.
// A new booking attempt for the same seat on the same flight will get a duplicate-key error.
seatBlockSchema.index({ flightId: 1, seatNumber: 1 }, { unique: true });

export const SeatBlock = mongoose.model<ISeatBlock>('SeatBlock', seatBlockSchema);
