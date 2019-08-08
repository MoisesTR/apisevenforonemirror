'use strict';

import * as mongoose from "mongoose";
import {Schema} from "mongoose";
import { ICardDocument, ICardModel} from "../interfaces/ICard";

export const cardSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    cardNumber: {type: String, index: {unique: true}},
    cardType: ['Pending Types'],
    expirationDate: Date,
    enabled: {
        type: Boolean,
        required: true,
        default: true
    },
    createdAt: Date,
    UpdatedAt: {type: Date, default: Date.now},
}, {
    timestamps: true
});

export default mongoose.model<ICardDocument, ICardModel>('card', cardSchema);

