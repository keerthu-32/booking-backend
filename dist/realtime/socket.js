"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../config/logger"));
// Store active users
const activeUsers = new Map();
class RealtimeService {
    constructor(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:5173',
                credentials: true,
            },
            transports: ['websocket', 'polling'],
        });
        this.setupMiddleware();
        this.setupConnectionHandlers();
    }
    setupMiddleware() {
        // Authenticate socket connections
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET || 'secret');
                socket.data.userId = decoded.userId;
                socket.data.email = decoded.email;
                next();
            }
            catch (error) {
                next(new Error('Authentication error: Invalid token'));
            }
        });
    }
    setupConnectionHandlers() {
        this.io.on('connection', (socket) => {
            const userId = socket.data.userId;
            const email = socket.data.email;
            // Register user
            activeUsers.set(userId, {
                userId,
                email,
                socketId: socket.id,
            });
            logger_1.default.info(`User connected: ${email} (${socket.id})`);
            // ===== SOCKET EVENTS =====
            // User joins a booking room (to receive updates for specific bookings)
            socket.on('join-booking', (bookingId) => {
                socket.join(`booking-${bookingId}`);
                logger_1.default.info(`User ${email} joined booking room: ${bookingId}`);
            });
            // User leaves booking room
            socket.on('leave-booking', (bookingId) => {
                socket.leave(`booking-${bookingId}`);
                logger_1.default.info(`User ${email} left booking room: ${bookingId}`);
            });
            // User joins flight room (to receive seat updates)
            socket.on('join-flight', (flightId) => {
                socket.join(`flight-${flightId}`);
                logger_1.default.info(`User ${email} joined flight room: ${flightId}`);
            });
            // User leaves flight room
            socket.on('leave-flight', (flightId) => {
                socket.leave(`flight-${flightId}`);
                logger_1.default.info(`User ${email} left flight room: ${flightId}`);
            });
            // Heartbeat to keep connection alive
            socket.on('ping', () => {
                socket.emit('pong');
            });
            // Handle disconnection
            socket.on('disconnect', () => {
                activeUsers.delete(userId);
                logger_1.default.info(`User disconnected: ${email} (${socket.id})`);
            });
            // Error handling
            socket.on('error', (error) => {
                logger_1.default.error(`Socket error for user ${email}:`, error);
            });
        });
    }
    // ===== PUBLIC METHODS FOR EMITTING EVENTS =====
    /**
     * Broadcast seat availability update to all users viewing a flight
     */
    broadcastSeatUpdate(flightId, cabinClass, availableSeats, totalSeats) {
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
    notifyBookingStatusChange(bookingId, userId, status, details) {
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
    notifyPaymentConfirmation(userId, bookingId, amount, currency) {
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
    notifyPaymentFailure(userId, bookingId, reason) {
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
    broadcastFlightStatusUpdate(flightId, status, details) {
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
    notifySeatUnavailable(flightId, cabinClass, seatNumber) {
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
    notifyPriceChange(flightId, cabinClass, newPrice, oldPrice) {
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
    notifyUser(userId, type, data) {
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
    broadcastToAll(event, data) {
        this.io.emit(event, {
            ...data,
            timestamp: new Date(),
        });
    }
    /**
     * Get active users count
     */
    getActiveUsersCount() {
        return activeUsers.size;
    }
    /**
     * Get all active users
     */
    getActiveUsers() {
        return Array.from(activeUsers.values());
    }
    /**
     * Check if user is online
     */
    isUserOnline(userId) {
        return activeUsers.has(userId);
    }
}
exports.RealtimeService = RealtimeService;
exports.default = RealtimeService;
//# sourceMappingURL=socket.js.map