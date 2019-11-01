import {model, Schema} from 'mongoose';
import {EModelNames} from '../interfaces/EModelNames';
import {ObjectId} from 'bson';
import {EPaymentRequestState} from '../enums/EPaymentRequestState';
import {IPaymentRequestDocument, IPaymentRequestModel} from '../interfaces/PaymentRequest';

const PaymentSchema = new Schema(
    {
        userId: {
            type: ObjectId,
            required: true,
            ref: EModelNames.User,
        },
        state: {
            type: String,
            enum: [
                EPaymentRequestState.CREATED,
                EPaymentRequestState.ACCEPT,
                EPaymentRequestState.DENIED,
                EPaymentRequestState.PENDING,
            ],
            index: true,
            required: true,
        },
        paypalId: {
            type: ObjectId,
            unique: true,
        },
        payer: {
            type: ObjectId,
            ref: EModelNames.User,
        },
        requireReview: {
            type: Boolean,
            required: true,
            default: false,
        },
        reviewer: {
            type: ObjectId,
            ref: EModelNames.User,
        },
    },
    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        },
    },
);

export default model<IPaymentRequestDocument, IPaymentRequestModel>(EModelNames.PaymentRequest, PaymentSchema);
