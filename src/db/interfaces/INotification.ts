import {ObjectId} from 'bson';
import {Document, Model} from 'mongoose';
import {IRole} from './IRole';
import {ENotificationTypes} from '../models/Notification';

export interface INotification {
    userId: ObjectId;
    notificationType: ENotificationTypes;
    content: string;
    read: boolean;
    groupId:  ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

export interface INotificationDocument extends INotification, Document {}

export interface INotificationModel extends Model<INotificationDocument> {}
