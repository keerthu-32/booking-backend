"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeEventService = void 0;
const Booking_1 = require("../models/Booking");
const logger_1 = __importDefault(require("../config/logger"));
class RealtimeEventService {
    constructor(realtime) {
        this.realtime = realtime;
    }
    /**
     * Emit when booking is created
     */
    async emitBookingCreated(bookingId, flightId, userId, cabinClass) {
        try {
            const booking = await Booking_1.Booking.findById(bookingId).populate('flightId');
            if (booking) {
                // Notify user
                this.realtime.notifyUser(userId, 'booking_created', {
                    bookingId,
                    bookingReference: booking.bookingReference,
                    flightId,
                    cabinClass,
                    totalAmount: booking.fareBreakdown.totalAmount,
                });
                // Broadcast seat update to flight viewers
                const flight = booking.flightId;
                if (flight) {
                    const cabinInfo = flight.cabinClasses.find((c) => c.type === cabinClass);
                    if (cabinInfo) {
                        this.realtime.broadcastSeatUpdate(flightId, cabinClass, cabinInfo.availableSeats, cabinInfo.totalSeats);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error emitting booking created event:', error);
        }
    }
    /**
     * Emit when booking is confirmed (after payment)
     */
    async emitBookingConfirmed(bookingId, userId) {
        try {
            const booking = await Booking_1.Booking.findById(bookingId);
            if (booking) {
                this.realtime.notifyBookingStatusChange(bookingId, userId, 'confirmed', {
                    bookingReference: booking.bookingReference,
                    totalAmount: booking.fareBreakdown.totalAmount,
                    passengers: booking.passengers.length,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Error emitting booking confirmed event:', error);
        }
    }
    /**
     * Emit when booking is cancelled
     */
    async emitBookingCancelled(bookingId, userId, refundAmount) {
        try {
            const booking = await Booking_1.Booking.findById(bookingId);
            if (booking) {
                this.realtime.notifyBookingStatusChange(bookingId, userId, 'cancelled', {
                    bookingReference: booking.bookingReference,
                    refundAmount: refundAmount || 0,
                    message: 'Your booking has been cancelled',
                });
                // Broadcast seat availability update
                const flightId = booking.flightId.toString();
                const cabinClass = booking.cabinClass;
                this.realtime.notifySeatUnavailable(flightId, cabinClass, booking.passengers[0].seatNumber);
            }
        }
        catch (error) {
            logger_1.default.error('Error emitting booking cancelled event:', error);
        }
    }
    /**
     * Emit when payment is successful
     */
    async emitPaymentSuccess(bookingId, userId, amount, currency) {
        try {
            this.realtime.notifyPaymentConfirmation(userId, bookingId, amount, currency);
            // Also update booking status
            const booking = await Booking_1.Booking.findById(bookingId);
            if (booking) {
                this.realtime.notifyBookingStatusChange(bookingId, userId, 'confirmed', {
                    paymentConfirmed: true,
                    amount,
                    currency,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Error emitting payment success event:', error);
        }
    }
    /**
     * Emit when payment fails
     */
    emitPaymentFailure(bookingId, userId, reason) {
        try {
            this.realtime.notifyPaymentFailure(userId, bookingId, reason);
        }
        catch (error) {
            logger_1.default.error('Error emitting payment failure event:', error);
        }
    }
    /**
     * Emit flight status update
     */
    emitFlightStatusUpdate(flightId, status, delay) {
        try {
            this.realtime.broadcastFlightStatusUpdate(flightId, status, {
                delay: delay || 0,
                updatedAt: new Date(),
            });
        }
        catch (error) {
            logger_1.default.error('Error emitting flight status update:', error);
        }
    }
    /**
     * Emit price change alert
     */
    emitPriceChange(flightId, cabinClass, newPrice, oldPrice) {
        try {
            this.realtime.notifyPriceChange(flightId, cabinClass, newPrice, oldPrice);
        }
        catch (error) {
            logger_1.default.error('Error emitting price change event:', error);
        }
    }
    /**
     * Emit seat available notification
     */
    emitSeatAvailable(flightId, cabinClass, seatNumber) {
        try {
            this.realtime.io.to(`flight-${flightId}`).emit('seat-available', {
                flightId,
                cabinClass,
                seatNumber,
                message: `Seat ${seatNumber} is now available in ${cabinClass}`,
                timestamp: new Date(),
            });
        }
        catch (error) {
            logger_1.default.error('Error emitting seat available event:', error);
        }
    }
    /**
     * Emit refund processed notification
     */
    emitRefundProcessed(bookingId, userId, refundAmount, currency) {
        try {
            this.realtime.notifyUser(userId, 'refund_processed', {
                bookingId,
                refundAmount,
                currency,
                message: `Refund of ${currency} ${refundAmount} has been processed`,
                timestamp: new Date(),
            });
        }
        catch (error) {
            logger_1.default.error('Error emitting refund processed event:', error);
        }
    }
    /**
     * Emit system-wide notification
     */
    emitSystemNotification(title, message, type) {
        try {
            this.realtime.broadcastToAll('system-notification', {
                title,
                message,
                type,
            });
        }
        catch (error) {
            logger_1.default.error('Error emitting system notification:', error);
        }
    }
    /**
     * Emit user-specific reminder
     */
    emitReminder(userId, type, message, data) {
        try {
            this.realtime.notifyUser(userId, `reminder_${type}`, {
                type,
                message,
                data,
            });
        }
        catch (error) {
            logger_1.default.error('Error emitting reminder:', error);
        }
    }
    /**
     * Get realtime service instance
     */
    getRealtimeService() {
        return this.realtime;
    }
}
exports.RealtimeEventService = RealtimeEventService;
exports.default = RealtimeEventService;
//# sourceMappingURL=events.js.map