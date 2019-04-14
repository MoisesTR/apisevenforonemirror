'use strict';

module.exports = (Schema, model) => {

    const   cardSchema = new Schema({
        user: {type: Schema.Types.ObjectId, ref: 'User'},
        cardNumber: {type:String, index:{unique: true}},
        cardType: ['Pending Types'],
        expirationDate: Date,
        enabled:    {
            type: Boolean,
            required: true,
            default: true
        },
        createdAt: Date,
        UpdatedAt: {type: Date, default: Date.now},
    },{
        timestamps: true
    });

    return model('Card', cardSchema);
};