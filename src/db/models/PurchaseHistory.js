
module.exports  = ( Schema, model) => {
    const purchaseHistory = Schema({
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
        moneyDirection: {
            type: Schema.Types.Boolean,
            required: true,
            default: function() {
                console.log('valor',this, this.action !== 'win')
                return this.action !== 'win';
            },
        },
        action: {
            type: String,
            enum: ['win','invest'],
            required: true,
        },
        payReference: {
            type: String,
        },
        quantity: {
            type: Schema.Types.Decimal128,
            required: true
        }
    },{
        timestamps: true
    });

    return model('PurchaseHistory', purchaseHistory);
};