import {model, Schema, Types} from 'mongoose';
import {EModelNames} from '../interfaces/EModelNames';
import {ECreditType} from '../enums/ECreditType';
import {ICreditGameDocument, ICreditGameModel} from '../interfaces/CreditGame';

const {ObjectId, Decimal128} = Types;

const CreditGameSchema = new Schema<ICreditGameDocument>(
    {
        userId: {
            type: ObjectId,
            required: true,
            ref: EModelNames.User,
        },
        groupId: {
            type: ObjectId,
            ref: EModelNames.GroupGame,
        },
        creditType: {
            type: String,
            enum: [ECreditType.FROZEN, ECreditType.DEPOSIT, ECreditType.WITHDRAWAL],
            required: false,
            index: true,
        },
        paymentRequest: {
            ref: EModelNames.PaymentRequest,
            type: ObjectId,
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

CreditGameSchema.index({
    userId: true,
});

// @ts-ignore
CreditGameSchema.pre(/^find/, function(next) {
    // @ts-ignore
    this.populate({
        path: 'userId',
        select: 'firstName userName email',
    }).populate({
        path: 'groupId',
        select: 'initialInvertion',
    });
    next();
});
export default model<ICreditGameDocument, ICreditGameModel>(EModelNames.CreditGame, CreditGameSchema);
