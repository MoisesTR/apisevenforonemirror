import {model, Schema, Types} from 'mongoose';
import {EModelNames} from '../interfaces/EModelNames';
import {EPaymentRequestState} from '../enums/PaymentRequestState';

const {ObjectId, Decimal128} = Types;

const PaymentSchema = new Schema(
    {
        uniqueId: {
            type: String,
            unique: true,
            required: true,
        },
        userId: {
            type: ObjectId,
            required: true,
            ref: EModelNames.User,
        },
        quantity: {
            required: true,
            type: Decimal128,
        },
        state: {
            enum: [
                EPaymentRequestState.ACCEPTED,
                EPaymentRequestState.CANCEL,
                EPaymentRequestState.CREATED,
                EPaymentRequestState.DENIED,
            ],
            required: true,
            type: String,
        },
    },
    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        },
    },
);

export default model(EModelNames.PaymentRequest, PaymentSchema);
