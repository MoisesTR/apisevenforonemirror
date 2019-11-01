import {ITimestamp} from './Timestamp';
import {Document, Model} from 'mongoose';
import {ObjectId} from 'bson';
import {EPaymentRequestState} from '../enums/EPaymentRequestState';

export interface IPaymentRequest extends ITimestamp {
    userId: ObjectId;
    state: EPaymentRequestState;
    paypalId?: ObjectId;
    payer: ObjectId;
    requireReview?: boolean;
    reviewer?: ObjectId;
}

export interface IPaymentRequestDocument extends Document, IPaymentRequest {}

export interface IPaymentRequestModel extends Model<IPaymentRequestDocument> {}
