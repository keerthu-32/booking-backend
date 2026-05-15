import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'booking_confirm' | 'booking_cancel' | 'flight_update' | 'reminder' | 'payment';
  channel: 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'failed';
  payload: Record<string, unknown>;
  sentAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['booking_confirm', 'booking_cancel', 'flight_update', 'reminder', 'payment'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
      index: true,
    },
    payload: { type: Schema.Types.Mixed },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
