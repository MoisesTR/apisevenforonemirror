import {ObjectId} from 'bson';
import {Document, Model} from 'mongoose';
import {IRole} from './IRole';

export interface INotification {
    idUser: ObjectId;
    idGroup?: ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface INotificationDocument extends IRole, Document {}

export interface INotificationModel extends Model<INotificationDocument>{
}
