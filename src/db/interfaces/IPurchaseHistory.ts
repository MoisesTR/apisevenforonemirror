import {ObjectId} from 'bson';
import {Document, Model, Schema} from 'mongoose';
import {EPurchaseAction} from '../enums/EPurchaseAction';

export interface IPurchaseHistory {
    userId: ObjectId;
    groupId: ObjectId;
    moneyDirection: boolean;
    action: EPurchaseAction;
    payReference: string;
    quantity: number;
}
export interface IPurchaseHistoryDocument extends Document, IPurchaseHistory {}
export interface IPurchaseHistoryModel extends Model<IPurchaseHistoryDocument> {}
export interface IPurchaseHistorySchema extends Schema<IPurchaseHistory> {}
