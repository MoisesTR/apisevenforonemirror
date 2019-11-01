import {Document, Model} from 'mongoose';
import {Decimal128, ObjectId} from 'bson';
import {ECreditType} from '../enums/ECreditType';
import {ITimestamp} from './Timestamp';

export interface ICreditGame extends ITimestamp {
    userId: ObjectId;
    groupId?: ObjectId;
    creditType: ECreditType;
    paymentRequest?: ObjectId;
    quantity: Decimal128;
}
export interface ICreditGameDocument extends Document, ICreditGame {}

export interface ICreditGameModel extends Model<ICreditGameDocument> {}
