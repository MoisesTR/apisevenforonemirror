import {ObjectId} from 'bson';
import {Document, Model, Types} from 'mongoose';
import {IPurchaseHistoryDocument} from './IPurchaseHistory';

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
    passwordChangedAt?: Date;
    passwordResetExp?: Date;
    paypalEmail: string;
}
export interface IUserDocument extends IUser, Document {
    getPurchaseHistoryById: (userId: Types.ObjectId) => Types.DocumentArray<IPurchaseHistoryDocument>;
    getPurchaseHistory: () => Promise<Types.DocumentArray<IPurchaseHistoryDocument>>;
    verifyToken: () => Promise<IUserDocument>;
    updateUser: (arr: any) => Promise<IUserDocument>;
    createPasswordResetToken: () => String;
}

export interface IUserModel extends Model<IUserDocument> {}
