import {Document, Model, Types} from "mongoose";
import {IUser, IUserDocument} from "./User";
import {IActivityTypesDocument} from "./ActivityTypes";

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
