import { Server as HTTPServer } from 'http';
interface SocketUser {
    userId: string;
    email: string;
    socketId: string;
}
export declare class RealtimeService {
    io: any;
    constructor(httpServer: HTTPServer);
    private setupMiddleware;
    private setupConnectionHandlers;
    /**
     * Broadcast seat availability update to all users viewing a flight
     */
    broadcastSeatUpdate(flightId: string, cabinClass: string, availableSeats: number, totalSeats: number): void;
    /**
     * Notify user of booking status change
     */
    notifyBookingStatusChange(bookingId: string, userId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed', details: any): void;
    /**
     * Notify user of payment confirmation
     */
    notifyPaymentConfirmation(userId: string, bookingId: string, amount: number, currency: string): void;
    /**
     * Notify user of payment failure
     */
    notifyPaymentFailure(userId: string, bookingId: string, reason: string): void;
    /**
     * Broadcast flight status update to all users viewing the flight
     */
    broadcastFlightStatusUpdate(flightId: string, status: string, details: any): void;
    /**
     * Notify about seat unavailability in real-time
     */
    notifySeatUnavailable(flightId: string, cabinClass: string, seatNumber: string): void;
    /**
     * Notify about price changes
     */
    notifyPriceChange(flightId: string, cabinClass: string, newPrice: number, oldPrice: number): void;
    /**
     * Send notification to specific user
     */
    notifyUser(userId: string, type: string, data: any): void;
    /**
     * Broadcast to all users
     */
    broadcastToAll(event: string, data: any): void;
    /**
     * Get active users count
     */
    getActiveUsersCount(): number;
    /**
     * Get all active users
     */
    getActiveUsers(): SocketUser[];
    /**
     * Check if user is online
     */
    isUserOnline(userId: string): boolean;
}
export default RealtimeService;
//# sourceMappingURL=socket.d.ts.map