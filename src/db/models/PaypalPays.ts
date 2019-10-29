import {model, Schema} from 'mongoose';
import {IPurchaseHistoryDocument} from '../interfaces/IPurchaseHistory';
import {EModelNames} from '../interfaces/EModelNames';

export enum EPurchaseHistoryAction {
    WIN = 'win',
    INVEST = 'invest',
}

const purchaseHistory = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: EModelNames.User,
            required: true,
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: EModelNames.GroupGame,
            required: true,
        },
        action: {
            type: String,
            enum: [EPurchaseHistoryAction.WIN, EPurchaseHistoryAction.INVEST],
            required: true,
        },
        moneyDirection: {
            type: Schema.Types.Boolean,
            required: true,
            default() {
                // @ts-ignore
                return this.action === EPurchaseHistoryAction.WIN;
            },
        },
        payReference: {
            type: String,
        },
        quantity: {
            type: Schema.Types.Decimal128,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

export default model<IPurchaseHistoryDocument>(EModelNames.PurchaseHistory, purchaseHistory);
