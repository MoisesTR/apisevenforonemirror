import mongoose, {model, Schema} from 'mongoose';
import {INotification, INotificationDocument, INotificationModel} from '../interfaces/INotification';

enum ENotificationTypes  {
    DEFAULT,
    POSITION_CHANGE,
    WIN,
    INACTIVITY
}

const NotificationSchema = new Schema({
    userId: {

    },
    notificationType: {
        type: Number,
        enum: ENotificationTypes,
        required: true
    },

},{
    timestamps: true
});

export default model<INotificationDocument, INotificationModel>('Notification', NotificationSchema);