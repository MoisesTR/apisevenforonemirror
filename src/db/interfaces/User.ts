import {ObjectId} from "bson";
import {Document, Model, Types} from "mongoose";
import {IPurchaseHistoryDocument} from "./PurchaseHistory";

export interface IUser {
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    phones: string[];
    birthDate: Date;
    gender: string;
    secretToken?: string;
    isVerified: boolean;
    role: ObjectId;
    image: string;
    passwordHash: string;
    enabled: boolean;
    provider: string;
}
export interface IUserDocument extends IUser, Document{
    getPurchaseHistoryById: (userId: Types.ObjectId) => Types.DocumentArray<IPurchaseHistoryDocument>
    getPurchaseHistory: () => Promise<Types.DocumentArray<IPurchaseHistoryDocument>>,
    verifyToken: () => Promise<IUserDocument>,
    updateUser: (arr: any) => Promise<IUserDocument>
}

export interface IUserModel extends Model<IUserDocument>{
}
