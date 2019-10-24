import {ObjectId} from 'bson';
import {Document, Model} from 'mongoose';
import {ENotificationTypes} from '../enums/ENotificationTypes';

export interface INotification {
    userId: ObjectId;
    notificationType: ENotificationTypes;
    content: string;
    read: boolean;
    groupId: ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

export interface INotificationDocument extends INotification, Document {}

export interface INotificationModel extends Model<INotificationDocument> {}
