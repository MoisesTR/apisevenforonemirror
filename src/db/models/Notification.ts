import {model, Schema} from 'mongoose';
import {ObjectId} from 'bson';
import {INotificationDocument, INotificationModel} from '../interfaces/INotification';
import {EModelNames} from '../interfaces/EModelNames';
import {User} from './index';
import {EMainEvents} from '../../sockets/constants/main';
import {sendMessageToConnectedUser} from '../../sockets/socket';
import {ENotificationTypes} from '../enums/ENotificationTypes';

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

NotificationSchema.post<INotificationDocument>('save', async function(doc, next) {
    if (doc.isNew) {
        const user = await User.findById(doc.userId);
        if (!user) {
            return;
        }
        await sendMessageToConnectedUser(user.userName, EMainEvents.NOTIFICATION, {notificationId: doc._id});
    }
    next();
});

export default model<INotificationDocument, INotificationModel>(EModelNames.Notification, NotificationSchema);
