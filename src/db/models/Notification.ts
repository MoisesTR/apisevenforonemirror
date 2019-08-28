import mongoose, {model, Schema} from 'mongoose';
import {INotification, INotificationDocument, INotificationModel} from '../interfaces/INotification';
import {ObjectId} from 'bson';
import {ETableNames} from '../interfaces/ETableNames';

export enum ENotificationTypes {
    DEFAULT = 'DEFAULT',
    POSITION_CHANGE = 'POSITION_CHANGE',
    WIN = 'WIN',
    INACTIVITY = 'INACTIVITY',
}

const NotificationSchema = new Schema(
    {
        userId: {
            type: ObjectId,
            required: true,
            ref: ETableNames.User,
        },
        notificationType: {
            type: String,
            enum: [
                ENotificationTypes.DEFAULT,
                ENotificationTypes.WIN,
                ENotificationTypes.POSITION_CHANGE,
                ENotificationTypes.POSITION_CHANGE,
                ENotificationTypes.INACTIVITY,
            ],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        read: {
            type: Boolean,
            required: true,
            default: false,
        },
        groupId: {
            type: ObjectId,
            required: false,
            ref: ETableNames.GroupGame,
        },
    },
    {
        timestamps: true,
    },
);

export default model<INotificationDocument, INotificationModel>(ETableNames.Notification, NotificationSchema);
