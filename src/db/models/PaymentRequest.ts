import {model, Schema, Types} from 'mongoose';
import {EModelNames} from '../interfaces/EModelNames';
import {ObjectId} from 'bson';

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
            ref: EModelNames.User
        },
        state: {
            type: String,
            required: true
        },
    },
    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        },
    },
);

export default model(EModelNames.PaymentRequest, PaymentSchema)
