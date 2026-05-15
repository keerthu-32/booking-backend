"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingService = exports.BookingService = void 0;
const Booking_1 = require("../models/Booking");
const Flight_1 = require("../models/Flight");
const Payment_1 = require("../models/Payment");
const errors_1 = require("../utils/errors");
const helpers_1 = require("../utils/helpers");
class BookingService {
    async createBooking(userId, data) {
        // Validate flight exists
        const flight = await Flight_1.Flight.findById(data.flightId);
        if (!flight) {
            throw new errors_1.NotFoundError('Flight not found');
        }
        // Get cabin class details
        const cabinClass = flight.cabinClasses.find((c) => c.type === data.cabinClass);
        if (!cabinClass) {
            throw new errors_1.NotFoundError('Cabin class not available on this flight');
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
        // Create booking
        const booking = new Booking_1.Booking({
            bookingReference: (0, helpers_1.generateBookingReference)(),
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
                currency: 'USD',
            },
        });
        await booking.save();
        // Update flight seat availability
        if (cabinClass.availableSeats >= data.passengers.length) {
            cabinClass.availableSeats -= data.passengers.length;
            await flight.save();
        }
        else {
            throw new errors_1.ValidationError('Not enough seats available in selected cabin class');
        }
        return booking;
    }
    async getBooking(bookingId, userId) {
        const query = { _id: bookingId };
        if (userId) {
            query.userId = userId;
        }
        const booking = await Booking_1.Booking.findOne(query).populate('flightId').populate('paymentId');
        if (!booking) {
            throw new errors_1.NotFoundError('Booking not found');
        }
        return booking;
    }
    async getUserBookings(userId) {
        const bookings = await Booking_1.Booking.find({ userId }).populate('flightId').sort({ createdAt: -1 });
        return bookings;
    }
    async cancelBooking(bookingId, userId) {
        const booking = await this.getBooking(bookingId, userId);
        if (booking.status === 'cancelled') {
            throw new errors_1.ValidationError('Booking is already cancelled');
        }
        // Get flight details for refund calculation
        const flight = await Flight_1.Flight.findById(booking.flightId);
        if (!flight) {
            throw new errors_1.NotFoundError('Flight not found');
        }
        // Calculate refund
        const refundAmount = (0, helpers_1.calculateRefundAmount)(booking.fareBreakdown.totalAmount, flight.departureTime);
        // Update booking status
        booking.status = 'cancelled';
        await booking.save();
        // Restore seat availability
        const cabinClass = flight.cabinClasses.find((c) => c.type === booking.cabinClass);
        if (cabinClass) {
            cabinClass.availableSeats += booking.passengers.length;
            await flight.save();
        }
        // Handle refund if there's a payment
        if (booking.paymentId) {
            const payment = await Payment_1.Payment.findByIdAndUpdate(booking.paymentId, {
                status: 'refunded',
                refundAmount,
            }, { new: true });
        }
        return booking;
    }
    async updateBookingStatus(bookingId, status) {
        const booking = await Booking_1.Booking.findByIdAndUpdate(bookingId, { status }, { new: true, runValidators: true });
        if (!booking) {
            throw new errors_1.NotFoundError('Booking not found');
        }
        return booking;
    }
}
exports.BookingService = BookingService;
exports.bookingService = new BookingService();
//# sourceMappingURL=booking.service.js.map