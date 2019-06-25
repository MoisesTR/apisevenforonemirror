import {model, Schema} from "mongoose";
import {IPurchaseHistoryDocument} from "../interfaces/PurchaseHistory";

const purchaseHistory = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'GroupGame',
        required: true
    },
    action: {
        type: String,
        enum: ['win', 'invest'],
        required: true,
    },
    moneyDirection: {
        type: Schema.Types.Boolean,
        required: true,
        default: function () {
            console.log('valor', this, this);
            // return ((this.get("action") !==  undefined) && (this.get("action") !== 'win'));
            return false
        },
    },
    payReference: {
        type: String,
    },
    quantity: {
        type: Schema.Types.Decimal128,
        required: true
    }
}, {
    timestamps: true
});

export default model<IPurchaseHistoryDocument>('PurchaseHistory', purchaseHistory);
