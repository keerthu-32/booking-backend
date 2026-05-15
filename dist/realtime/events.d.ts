import RealtimeService from './socket';
export declare class RealtimeEventService {
    private realtime;
    constructor(realtime: RealtimeService);
    /**
     * Emit when booking is created
     */
    emitBookingCreated(bookingId: string, flightId: string, userId: string, cabinClass: string): Promise<void>;
    /**
     * Emit when booking is confirmed (after payment)
     */
    emitBookingConfirmed(bookingId: string, userId: string): Promise<void>;
    /**
     * Emit when booking is cancelled
     */
    emitBookingCancelled(bookingId: string, userId: string, refundAmount?: number): Promise<void>;
    /**
     * Emit when payment is successful
     */
    emitPaymentSuccess(bookingId: string, userId: string, amount: number, currency: string): Promise<void>;
    /**
     * Emit when payment fails
     */
    emitPaymentFailure(bookingId: string, userId: string, reason: string): void;
    /**
     * Emit flight status update
     */
    emitFlightStatusUpdate(flightId: string, status: string, delay?: number): void;
    /**
     * Emit price change alert
     */
    emitPriceChange(flightId: string, cabinClass: string, newPrice: number, oldPrice: number): void;
    /**
     * Emit seat available notification
     */
    emitSeatAvailable(flightId: string, cabinClass: string, seatNumber: string): void;
    /**
     * Emit refund processed notification
     */
    emitRefundProcessed(bookingId: string, userId: string, refundAmount: number, currency: string): void;
    /**
     * Emit system-wide notification
     */
    emitSystemNotification(title: string, message: string, type: 'info' | 'warning' | 'alert'): void;
    /**
     * Emit user-specific reminder
     */
    emitReminder(userId: string, type: string, message: string, data: any): void;
    /**
     * Get realtime service instance
     */
    getRealtimeService(): RealtimeService;
}
export default RealtimeEventService;
//# sourceMappingURL=events.d.ts.map