import {model, Schema} from 'mongoose';
import {IPurchaseHistory, IPurchaseHistoryDocument, IPurchaseHistoryModel} from '../interfaces/IPurchaseHistory';
import {ETableNames} from '../interfaces/ETableNames';
export enum EPurchaseHistoryAction {
    WIN = 'win',
    INVEST = 'invest',
}

const purchaseHistory = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: ETableNames.User,
            required: true,
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: ETableNames.GroupGame,
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
            default: function() {
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

export default model<IPurchaseHistoryDocument>(ETableNames.PurchaseHistory, purchaseHistory);
