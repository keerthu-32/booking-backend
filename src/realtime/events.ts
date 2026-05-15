import RealtimeService from './socket';
import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import logger from '../config/logger';

export class RealtimeEventService {
  private realtime: RealtimeService;

  constructor(realtime: RealtimeService) {
    this.realtime = realtime;
  }

  /**
   * Emit when booking is created
   */
  async emitBookingCreated(bookingId: string, flightId: string, userId: string, cabinClass: string) {
    try {
      const booking = await Booking.findById(bookingId).populate('flightId');
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
        const flight: any = booking.flightId;
        if (flight) {
          const cabinInfo = flight.cabinClasses.find((c: any) => c.type === cabinClass);
          if (cabinInfo) {
            this.realtime.broadcastSeatUpdate(flightId, cabinClass, cabinInfo.availableSeats, cabinInfo.totalSeats);
          }
        }
      }
    } catch (error) {
      logger.error('Error emitting booking created event:', error);
    }
  }

  /**
   * Emit when booking is confirmed (after payment)
   */
  async emitBookingConfirmed(bookingId: string, userId: string) {
    try {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        this.realtime.notifyBookingStatusChange(bookingId, userId, 'confirmed', {
          bookingReference: booking.bookingReference,
          totalAmount: booking.fareBreakdown.totalAmount,
          passengers: booking.passengers.length,
        });
      }
    } catch (error) {
      logger.error('Error emitting booking confirmed event:', error);
    }
  }

  /**
   * Emit when booking is cancelled
   */
  async emitBookingCancelled(bookingId: string, userId: string, refundAmount?: number) {
    try {
      const booking = await Booking.findById(bookingId);
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
    } catch (error) {
      logger.error('Error emitting booking cancelled event:', error);
    }
  }

  /**
   * Emit when payment is successful
   */
  async emitPaymentSuccess(bookingId: string, userId: string, amount: number, currency: string) {
    try {
      this.realtime.notifyPaymentConfirmation(userId, bookingId, amount, currency);
      
      // Also update booking status
      const booking = await Booking.findById(bookingId);
      if (booking) {
        this.realtime.notifyBookingStatusChange(bookingId, userId, 'confirmed', {
          paymentConfirmed: true,
          amount,
          currency,
        });
      }
    } catch (error) {
      logger.error('Error emitting payment success event:', error);
    }
  }

  /**
   * Emit when payment fails
   */
  emitPaymentFailure(bookingId: string, userId: string, reason: string) {
    try {
      this.realtime.notifyPaymentFailure(userId, bookingId, reason);
    } catch (error) {
      logger.error('Error emitting payment failure event:', error);
    }
  }

  /**
   * Emit flight status update
   */
  emitFlightStatusUpdate(flightId: string, status: string, delay?: number) {
    try {
      this.realtime.broadcastFlightStatusUpdate(flightId, status, {
        delay: delay || 0,
        updatedAt: new Date(),
      });
    } catch (error) {
      logger.error('Error emitting flight status update:', error);
    }
  }

  /**
   * Emit price change alert
   */
  emitPriceChange(flightId: string, cabinClass: string, newPrice: number, oldPrice: number) {
    try {
      this.realtime.notifyPriceChange(flightId, cabinClass, newPrice, oldPrice);
    } catch (error) {
      logger.error('Error emitting price change event:', error);
    }
  }

  /**
   * Emit seat available notification
   */
  emitSeatAvailable(flightId: string, cabinClass: string, seatNumber: string) {
    try {
      this.realtime.io.to(`flight-${flightId}`).emit('seat-available', {
        flightId,
        cabinClass,
        seatNumber,
        message: `Seat ${seatNumber} is now available in ${cabinClass}`,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error emitting seat available event:', error);
    }
  }

  /**
   * Emit refund processed notification
   */
  emitRefundProcessed(bookingId: string, userId: string, refundAmount: number, currency: string) {
    try {
      this.realtime.notifyUser(userId, 'refund_processed', {
        bookingId,
        refundAmount,
        currency,
        message: `Refund of ${currency} ${refundAmount} has been processed`,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error emitting refund processed event:', error);
    }
  }

  /**
   * Emit system-wide notification
   */
  emitSystemNotification(title: string, message: string, type: 'info' | 'warning' | 'alert') {
    try {
      this.realtime.broadcastToAll('system-notification', {
        title,
        message,
        type,
      });
    } catch (error) {
      logger.error('Error emitting system notification:', error);
    }
  }

  /**
   * Emit user-specific reminder
   */
  emitReminder(userId: string, type: string, message: string, data: any) {
    try {
      this.realtime.notifyUser(userId, `reminder_${type}`, {
        type,
        message,
        data,
      });
    } catch (error) {
      logger.error('Error emitting reminder:', error);
    }
  }

  /**
   * Get realtime service instance
   */
  getRealtimeService(): RealtimeService {
    return this.realtime;
  }
}

export default RealtimeEventService;
