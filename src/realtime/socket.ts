import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';

// Type definitions
interface SocketUser {
  userId: string;
  email: string;
  socketId: string;
}

// Store active users
const activeUsers = new Map<string, SocketUser>();

export class RealtimeService {
  public io: any;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();
  }

  private setupMiddleware() {
    // Authenticate socket connections
    this.io.use((socket: any, next: any) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret') as any;
        socket.data.userId = decoded.userId;
        socket.data.email = decoded.email;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupConnectionHandlers() {
    this.io.on('connection', (socket: any) => {
      const userId = socket.data.userId;
      const email = socket.data.email;

      // Register user
      activeUsers.set(userId, {
        userId,
        email,
        socketId: socket.id,
      });

      logger.info(`User connected: ${email} (${socket.id})`);

      // ===== SOCKET EVENTS =====

      // User joins a booking room (to receive updates for specific bookings)
      socket.on('join-booking', (bookingId: string) => {
        socket.join(`booking-${bookingId}`);
        logger.info(`User ${email} joined booking room: ${bookingId}`);
      });

      // User leaves booking room
      socket.on('leave-booking', (bookingId: string) => {
        socket.leave(`booking-${bookingId}`);
        logger.info(`User ${email} left booking room: ${bookingId}`);
      });

      // User joins flight room (to receive seat updates)
      socket.on('join-flight', (flightId: string) => {
        socket.join(`flight-${flightId}`);
        logger.info(`User ${email} joined flight room: ${flightId}`);
      });

      // User leaves flight room
      socket.on('leave-flight', (flightId: string) => {
        socket.leave(`flight-${flightId}`);
        logger.info(`User ${email} left flight room: ${flightId}`);
      });

      // Heartbeat to keep connection alive
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        activeUsers.delete(userId);
        logger.info(`User disconnected: ${email} (${socket.id})`);
      });

      // Error handling
      socket.on('error', (error: any) => {
        logger.error(`Socket error for user ${email}:`, error);
      });
    });
  }

  // ===== PUBLIC METHODS FOR EMITTING EVENTS =====

  /**
   * Broadcast seat availability update to all users viewing a flight
   */
  public broadcastSeatUpdate(flightId: string, cabinClass: string, availableSeats: number, totalSeats: number) {
    this.io.to(`flight-${flightId}`).emit('seat-update', {
      flightId,
      cabinClass,
      availableSeats,
      totalSeats,
      timestamp: new Date(),
    });
  }

  /**
   * Notify user of booking status change
   */
  public notifyBookingStatusChange(
    bookingId: string,
    userId: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
    details: any
  ) {
    // Send to booking room (all users viewing this booking)
    this.io.to(`booking-${bookingId}`).emit('booking-status-changed', {
      bookingId,
      status,
      details,
      timestamp: new Date(),
    });

    // Also send to specific user
    const user = activeUsers.get(userId);
    if (user) {
      this.io.to(user.socketId).emit('booking-notification', {
        type: 'status_change',
        bookingId,
        status,
        message: `Your booking is now ${status}`,
        details,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Notify user of payment confirmation
   */
  public notifyPaymentConfirmation(userId: string, bookingId: string, amount: number, currency: string) {
    const user = activeUsers.get(userId);
    if (user) {
      this.io.to(user.socketId).emit('payment-notification', {
        type: 'payment_confirmed',
        bookingId,
        amount,
        currency,
        message: `Payment of ${currency} ${amount} confirmed!`,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Notify user of payment failure
   */
  public notifyPaymentFailure(userId: string, bookingId: string, reason: string) {
    const user = activeUsers.get(userId);
    if (user) {
      this.io.to(user.socketId).emit('payment-notification', {
        type: 'payment_failed',
        bookingId,
        message: `Payment failed: ${reason}`,
        reason,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Broadcast flight status update to all users viewing the flight
   */
  public broadcastFlightStatusUpdate(flightId: string, status: string, details: any) {
    this.io.to(`flight-${flightId}`).emit('flight-status-update', {
      flightId,
      status,
      details,
      message: `Flight status updated to: ${status}`,
      timestamp: new Date(),
    });
  }

  /**
   * Notify about seat unavailability in real-time
   */
  public notifySeatUnavailable(flightId: string, cabinClass: string, seatNumber: string) {
    this.io.to(`flight-${flightId}`).emit('seat-unavailable', {
      flightId,
      cabinClass,
      seatNumber,
      message: `Seat ${seatNumber} in ${cabinClass} is no longer available`,
      timestamp: new Date(),
    });
  }

  /**
   * Notify about price changes
   */
  public notifyPriceChange(flightId: string, cabinClass: string, newPrice: number, oldPrice: number) {
    this.io.to(`flight-${flightId}`).emit('price-update', {
      flightId,
      cabinClass,
      newPrice,
      oldPrice,
      priceChange: newPrice - oldPrice,
      timestamp: new Date(),
    });
  }

  /**
   * Send notification to specific user
   */
  public notifyUser(userId: string, type: string, data: any) {
    const user = activeUsers.get(userId);
    if (user) {
      this.io.to(user.socketId).emit('notification', {
        type,
        data,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Broadcast to all users
   */
  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }

  /**
   * Get active users count
   */
  public getActiveUsersCount(): number {
    return activeUsers.size;
  }

  /**
   * Get all active users
   */
  public getActiveUsers(): SocketUser[] {
    return Array.from(activeUsers.values());
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: string): boolean {
    return activeUsers.has(userId);
  }
}

export default RealtimeService;
