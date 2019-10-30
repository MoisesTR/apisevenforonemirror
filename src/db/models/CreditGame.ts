import {model, Schema, Types} from 'mongoose';
import {EModelNames} from '../interfaces/EModelNames';
import {ECreditOrigin} from '../enums/ECreditOrigin';

const {ObjectId, Decimal128} = Types;

const CreditGameSchema = new Schema(
    {
        userId: {
            type: ObjectId,
            required: true,
            ref: EModelNames.User,
        },
        origin: {
            type: String,
            enum: [ECreditOrigin.BONIFICATION, ECreditOrigin.PRIZE_GW, ECreditOrigin.REFOUND],
            required: false,
        },
        quantity: {
            type: Decimal128,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

export default model(EModelNames.CreditGame, CreditGameSchema);
