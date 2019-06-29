import {Document, Model, Types} from "mongoose";
import {IUser, IUserDocument} from "./IUser";
import {IActivityTypesDocument} from "./IActivityTypes";

export interface IUserActivityLog {
    userId: Types.ObjectId | IUserDocument;
    userSnapshot: IUser;
    activityId: Types.ObjectId | IActivityTypesDocument;
}

export interface IUserActivityLogDocument extends Document{

}

export interface IUserActivityLogModel extends Model<IUserActivityLogDocument> {
    byUser: (userId: string) => IUserActivityLogDocument[]
}
