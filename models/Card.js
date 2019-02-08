const {Schema, model} = require('mongoose');

const   cardSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    cardNumber: {type:String, index:{unique: true}},
    cardType: ['Pending Types'],
    expirationDate: Date,
    enabled:    Boolean,
    createdAt: Date,
    UpdatedAt: {type: Date, default: Date.now},
});

module.exports = model('Card', cardSchema);