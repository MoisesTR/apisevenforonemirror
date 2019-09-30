import {model, Schema} from 'mongoose';
import {INotificationDocument, INotificationModel} from '../interfaces/INotification';
import {ObjectId} from 'bson';
import {EModelNames} from '../interfaces/EModelNames';
import {User} from './index';
import {redisPub} from '../../redis/redis';
import DynamicKey from '../../redis/keys/dynamics';
import {EMainEvents} from '../../sockets/constants/main';
import {mainSocket} from '../../sockets/socket';

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
NotificationSchema.post<INotificationDocument>('save', async function (doc, next) {
    if (doc.isNew) {
        const user = await User.findById(doc.userId);
        if (!user) {
            return;
        }
        const socketWinner = await redisPub.hget(DynamicKey.hash.socketsUser(user.userName), 'main');
        // @ts-ignore
        mainSocket.of('/').adapter.clients((err, clientes) => {
            if (!!socketWinner && clientes.includes(socketWinner)) {
                mainSocket.to(socketWinner).emit(EMainEvents.NOTIFICATION, {notificationId: doc._id});
            }
        });
    }
    next();
});

export default model<INotificationDocument, INotificationModel>(EModelNames.Notification, NotificationSchema);
