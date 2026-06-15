import { Booking, IBooking } from '../models/Booking';
import { Flight } from '../models/Flight';
import { Payment } from '../models/Payment';
import { Notification } from '../models/Notification';
import { NotFoundError, ValidationError } from '../utils/errors';
import { generateBookingReference, calculateRefundAmount } from '../utils/helpers';
import mongoose from 'mongoose';

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

    // Use a MongoDB session/transaction to atomically check seat availability
    // and create the booking, preventing race conditions where two simultaneous
    // requests for the same seat both pass the conflict check before either writes.
    const session = await mongoose.startSession();

    let booking: IBooking;
    try {
      await session.withTransaction(async () => {
        // Re-check for already-booked seats inside the transaction (atomic read)
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

        const conflictingSeats = seatNumbers.filter((seat) => occupiedSeats.has(seat));
        if (conflictingSeats.length > 0) {
          throw new ValidationError(
            `The following seats are already booked: ${conflictingSeats.join(', ')}. Please select different seats.`
          );
        }

        // Create booking inside the transaction
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

        // Update flight seat availability inside the transaction
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

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

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

    // Restore seat availability
    const cabinClass = flight.cabinClasses.find((c) => c.type === booking.cabinClass);
    if (cabinClass) {
      cabinClass.availableSeats += booking.passengers.length;
      await flight.save();
    }

    // Handle refund if there's a payment
    if (booking.paymentId) {
      const payment = await Payment.findByIdAndUpdate(
        booking.paymentId,
        {
          status: 'refunded',
          refundAmount,
        },
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

  async getOccupiedSeats(flightId: string): Promise<string[]> {
    const existingBookings = await Booking.find({
      flightId,
      status: { $in: ['confirmed', 'pending'] },
    });

    const occupiedSeats = new Set<string>();
    existingBookings.forEach((booking) => {
      booking.passengers.forEach((passenger) => {
        occupiedSeats.add(passenger.seatNumber);
      });
    });

    return Array.from(occupiedSeats);
  }
}

export const bookingService = new BookingService();
