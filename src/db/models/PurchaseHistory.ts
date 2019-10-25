import {model, Schema} from 'mongoose';
import {IPurchaseHistoryDocument, IPurchaseHistorySchema} from '../interfaces/IPurchaseHistory';
import {EModelNames} from '../interfaces/EModelNames';
import {EPurchaseAction} from '../enums/EPurchaseAction';

const purchaseHistory = new Schema<IPurchaseHistorySchema>(
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
            enum: [EPurchaseAction.WIN, EPurchaseAction.INVEST],
            required: true,
            type: String,
        },
        moneyDirection: {
            type: Schema.Types.Boolean,
            required: true,
            default() {
                // @ts-ignore
                return this.action === EPurchaseAction.WIN;
            },
        },
        payReference: {
            type: String,
        },
        quantity: {
            required: true,
            type: Schema.Types.Decimal128,
        },
    },
    {
        timestamps: true,
    },
);

export default model<IPurchaseHistoryDocument>(EModelNames.PurchaseHistory, purchaseHistory);
