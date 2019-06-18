import {ObjectId} from "bson";
import {Document, Model} from "mongoose";

export enum EAction {
    WIN = 'win',
    INVEST = 'invest'
}

export interface IPurchaseHistory {
    userId: ObjectId;
    groupId: ObjectId;
    moneyDirection: boolean;
    action: EAction;
    payReference: string;
    quantity: number;
}
export interface IPurchaseHistoryDocument extends Document, IPurchaseHistory{
}
export interface IPurchaseHistoryModel extends Model<IPurchaseHistoryDocument>{
}
