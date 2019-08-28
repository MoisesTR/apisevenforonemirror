import {Schema, model, Types} from 'mongoose';
import {EModelNames} from '../interfaces/EModelNames';
const {ObjectId, Decimal128} = Types;

const paymentsSchema = new Schema({
    paypalReference: {
        type: String,
        unique: true,
        required: [true, 'A paypal reference is required']
    },
    payState: {
        type: String,
        enum: {
          values: [],
          message: ''
        },
        required: [true, '']
    },
    user: {
        type: ObjectId,
        required: true,
        ref: EModelNames.User
    },
    requestedQuantity: {
        type: Decimal128,
        required: true,
        min: 0
    },
},{
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

export default model(EModelNames.Payments, paymentsSchema);