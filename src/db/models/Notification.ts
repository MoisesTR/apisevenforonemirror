import mongoose, {model, Schema} from 'mongoose';
import {INotification, INotificationDocument, INotificationModel} from '../interfaces/INotification';
import {ObjectId} from 'bson';
import {EModelNames} from '../interfaces/EModelNames';

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
            ref: EModelNames.User,
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
            ref: EModelNames.GroupGame,
        },
    },
    {
        timestamps: true,
    },
);

export default model<INotificationDocument, INotificationModel>(EModelNames.Notification, NotificationSchema);
