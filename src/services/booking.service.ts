import { Booking, IBooking } from '../models/Booking';
import { Flight } from '../models/Flight';
import { Payment } from '../models/Payment';
import { Notification } from '../models/Notification';
import { SeatBlock } from '../models/SeatBlock';
import { NotFoundError, ValidationError } from '../utils/errors';
import { generateBookingReference, calculateRefundAmount } from '../utils/helpers';
import mongoose from 'mongoose';

// Seats are held for 8 minutes from booking creation
const SEAT_HOLD_MINUTES = 8;

export interface PassengerData {
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  passportNumber?: string;
  nationality: string;
  seatNumber: string;
  mealPreference?: string;
}

export interface CreateBookingData {
  flightId: string;
  cabinClass: 'economy' | 'business' | 'first';
  passengers: PassengerData[];
}

export class BookingService {
  async createBooking(userId: string, data: CreateBookingData): Promise<IBooking> {
    // Validate flight exists
    const flight = await Flight.findById(data.flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    if (flight.departureTime.getTime() <= Date.now()) {
      throw new ValidationError('This flight has already departed and cannot be booked');
    }

    // Get cabin class details
    const cabinClass = flight.cabinClasses.find((c) => c.type === data.cabinClass);
    if (!cabinClass) {
      throw new NotFoundError('Cabin class not available on this flight');
    }

    if (cabinClass.availableSeats < data.passengers.length) {
      throw new ValidationError('Not enough seats available in selected cabin class');
    }

    // Validate seat selection - check for duplicates within the booking
    const seatNumbers = data.passengers.map((p) => p.seatNumber);
    const uniqueSeats = new Set(seatNumbers);
    if (uniqueSeats.size !== seatNumbers.length) {
      throw new ValidationError('Duplicate seat numbers detected. Each passenger must have a unique seat.');
    }

    const isDomestic = flight.origin.country.trim().toLowerCase() === flight.destination.country.trim().toLowerCase();

    // Validate passenger details uniqueness and passport presence (if international)
    const seenPassengers = new Set<string>();
    const seenPassports = new Set<string>();

    for (let i = 0; i < data.passengers.length; i++) {
      const p = data.passengers[i];

      // Check passport number requirement for international flights
      if (!isDomestic) {
        if (!p.passportNumber || p.passportNumber.trim() === '') {
          throw new ValidationError(`Passport number is required for passenger ${i + 1} (${p.firstName} ${p.lastName}) on international flights.`);
        }
      }

      // Check unique passenger details (firstName + lastName + dateOfBirth)
      const dobStr = p.dateOfBirth instanceof Date ? p.dateOfBirth.toISOString().split('T')[0] : new Date(p.dateOfBirth).toISOString().split('T')[0];
      const identityKey = `${p.firstName.trim().toLowerCase()}|${p.lastName.trim().toLowerCase()}|${dobStr}`;

      if (seenPassengers.has(identityKey)) {
        throw new ValidationError(`Duplicate passenger details detected for ${p.firstName} ${p.lastName}. Each seat must be booked for a unique traveler.`);
      }
      seenPassengers.add(identityKey);

      // Check passport uniqueness if passport is provided
      if (p.passportNumber && p.passportNumber.trim() !== '') {
        const passportKey = p.passportNumber.trim().toLowerCase();
        if (seenPassports.has(passportKey)) {
          throw new ValidationError(`Duplicate passport number detected: ${p.passportNumber}. Each traveler must have a unique passport.`);
        }
        seenPassports.add(passportKey);
      }
    }

    // Calculate fare
    const baseFare = cabinClass.baseFare * data.passengers.length;
    const taxes = baseFare * 0.125; // 12.5% tax
    const fees = 15 * data.passengers.length; // Per passenger fee
    const totalAmount = baseFare + taxes + fees;

    // Normalize passenger dates (validators provide strings)
    const normalizedPassengers = data.passengers.map((p) => ({
      ...p,
      dateOfBirth: p.dateOfBirth instanceof Date ? p.dateOfBirth : new Date(p.dateOfBirth),
    }));

    // Use a MongoDB session/transaction to atomically check seat availability,
    // check active seat blocks, create the booking, and create seat blocks.
    // This prevents race conditions where two simultaneous requests for the same
    // seat both pass the conflict check before either writes.
    const session = await mongoose.startSession();

    let booking: IBooking;
    try {
      await session.withTransaction(async () => {
        // 1. Re-check for already-confirmed/pending booked seats inside the transaction
        const existingBookings = await Booking.find({
          flightId: data.flightId,
          status: { $in: ['confirmed', 'pending'] },
        }).session(session);

        const occupiedSeats = new Set<string>();
        existingBookings.forEach((b) => {
          b.passengers.forEach((passenger) => {
            occupiedSeats.add(passenger.seatNumber);
          });
        });

        // 2. Also check active seat blocks from OTHER users (blocks for this userId are ok — re-hold)
        const activeBlocks = await SeatBlock.find({
          flightId: data.flightId,
          userId: { $ne: userId }, // exclude the current user's own existing blocks
          expiresAt: { $gt: new Date() },
        }).session(session);

        activeBlocks.forEach((block) => {
          occupiedSeats.add(block.seatNumber);
        });

        const conflictingSeats = seatNumbers.filter((seat) => occupiedSeats.has(seat));
        if (conflictingSeats.length > 0) {
          throw new ValidationError(
            `The following seats are unavailable: ${conflictingSeats.join(', ')}. Please select different seats.`
          );
        }

        // 3. Create booking inside the transaction
        const newBooking = new Booking({
          bookingReference: generateBookingReference(),
          userId,
          flightId: data.flightId,
          passengers: normalizedPassengers,
          cabinClass: data.cabinClass,
          status: 'pending',
          fareBreakdown: {
            baseFare,
            taxes,
            fees,
            totalAmount,
            currency: 'INR',
          },
        });

        await newBooking.save({ session });

        // 4. Create seat blocks (8-minute TTL hold) inside the transaction.
        //    Use upsert so if the user somehow already has a block for this seat, refresh it.
        const holdExpiry = new Date(Date.now() + SEAT_HOLD_MINUTES * 60 * 1000);
        for (const seatNum of seatNumbers) {
          await SeatBlock.findOneAndUpdate(
            { flightId: data.flightId, seatNumber: seatNum },
            {
              flightId: data.flightId,
              seatNumber: seatNum,
              userId,
              bookingId: newBooking._id,
              expiresAt: holdExpiry,
            },
            { upsert: true, session }
          );
        }

        // 5. Update flight seat availability inside the transaction
        const flightToUpdate = await Flight.findById(data.flightId).session(session);
        if (flightToUpdate) {
          const cabinToUpdate = flightToUpdate.cabinClasses.find((c) => c.type === data.cabinClass);
          if (cabinToUpdate) {
            cabinToUpdate.availableSeats -= data.passengers.length;
            await flightToUpdate.save({ session });
          }
        }

        booking = newBooking;
      });
    } finally {
      session.endSession();
    }

    await Notification.create({
      userId,
      type: 'booking_confirm',
      channel: 'email',
      status: 'pending',
      payload: {
        bookingReference: booking!.bookingReference,
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        cabinClass: booking!.cabinClass,
        totalAmount: booking!.fareBreakdown.totalAmount,
        paymentStatus: 'pending',
      },
    });

    return booking!;
  }

  async getBooking(bookingId: string, userId?: string): Promise<IBooking> {
    const query: any = { _id: bookingId };
    if (userId) {
      query.userId = userId;
    }

    const booking = await Booking.findOne(query).populate('flightId').populate('paymentId');
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    return booking;
  }

  async getUserBookings(userId: string): Promise<IBooking[]> {
    const bookings = await Booking.find({ userId }).populate('flightId').sort({ createdAt: -1 });
    return bookings;
  }

  async cancelBooking(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await this.getBooking(bookingId, userId);

    if (booking.status === 'cancelled') {
      throw new ValidationError('Booking is already cancelled');
    }

    // Get flight details for refund calculation
    const flight = await Flight.findById(booking.flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    // Calculate refund
    const refundAmount = calculateRefundAmount(
      booking.fareBreakdown.totalAmount,
      flight.departureTime
    );

    // Restore seat availability FIRST (before marking booking cancelled),
    // so that if flight.save() fails, the booking is not left as cancelled
    // with no corresponding seat restoration.
    const cabinClass = flight.cabinClasses.find((c) => c.type === booking.cabinClass);
    if (cabinClass) {
      cabinClass.availableSeats += booking.passengers.length;
      await flight.save();
    }

    // Now mark the booking as cancelled
    booking.status = 'cancelled';
    await booking.save();

    // Remove any lingering seat blocks for these seats
    const seatNumbers = booking.passengers.map((p) => p.seatNumber);
    await SeatBlock.deleteMany({ flightId: booking.flightId, seatNumber: { $in: seatNumbers } });

    await Notification.create({
      userId: booking.userId,
      type: 'booking_cancel',
      channel: 'email',
      status: 'pending',
      payload: {
        bookingReference: booking.bookingReference,
        refundAmount,
        flightId: flight._id,
      },
    });

    // Handle refund if there's a payment
    if (booking.paymentId) {
      await Payment.findByIdAndUpdate(
        booking.paymentId,
        { status: 'refunded', refundAmount },
        { new: true }
      );
    }

    return booking;
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<IBooking> {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    return booking;
  }

  /**
   * Returns seats that are either:
   *  - Permanently booked (confirmed)
   *  - In an active 8-minute hold by another user
   *
   * Optionally excludes the current user's own blocks so their selected
   * seats don't show as blocked on the seat map they're looking at.
   */
  async getOccupiedSeats(
    flightId: string,
    excludeUserId?: string
  ): Promise<{ occupiedSeats: string[]; blockedSeats: string[] }> {
    // Confirmed bookings — permanently occupied
    const confirmedBookings = await Booking.find({
      flightId,
      status: 'confirmed',
    });

    const occupiedSeats = new Set<string>();
    confirmedBookings.forEach((booking) => {
      booking.passengers.forEach((passenger) => {
        occupiedSeats.add(passenger.seatNumber);
      });
    });

    // Also include pending bookings older than 8 minutes (they survived without paying)
    // so they don't silently block seats indefinitely
    const holdExpiry = new Date(Date.now() - SEAT_HOLD_MINUTES * 60 * 1000);
    const recentPendingBookings = await Booking.find({
      flightId,
      status: 'pending',
      createdAt: { $gte: holdExpiry }, // created within the last 8 minutes
    });
    recentPendingBookings.forEach((booking) => {
      booking.passengers.forEach((passenger) => {
        occupiedSeats.add(passenger.seatNumber);
      });
    });

    // Active seat blocks from OTHER users (real-time holds)
    const blockQuery: any = {
      flightId,
      expiresAt: { $gt: new Date() },
    };
    if (excludeUserId) {
      blockQuery.userId = { $ne: excludeUserId };
    }
    const activeBlocks = await SeatBlock.find(blockQuery);
    const blockedSeats = activeBlocks.map((b) => b.seatNumber);

    // Return them separately so the frontend can style them differently (held vs booked)
    return {
      occupiedSeats: Array.from(occupiedSeats),
      blockedSeats,
    };
  }
}

export const bookingService = new BookingService();
