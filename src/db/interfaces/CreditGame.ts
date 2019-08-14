import {Document, Model} from 'mongoose';

export interface IActivityTypes {
    activityName: string;
    activityDesc?: string;
}
export interface IActivityTypesDocument extends Document, IActivityTypes {}

export interface IActivityTypesModel extends Model<IActivityTypesDocument> {}
