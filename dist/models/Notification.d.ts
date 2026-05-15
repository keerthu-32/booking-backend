import mongoose, { Document, Types } from 'mongoose';
export interface INotification extends Document {
    userId: Types.ObjectId;
    type: 'booking_confirm' | 'booking_cancel' | 'flight_update' | 'reminder' | 'payment';
    channel: 'email' | 'sms' | 'push';
    status: 'pending' | 'sent' | 'failed';
    payload: Record<string, unknown>;
    sentAt?: Date;
    createdAt: Date;
}
export declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Notification.d.ts.map