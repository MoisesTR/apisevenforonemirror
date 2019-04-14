
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
                return ( this.action === 'win' );
            },
        },
        action: {
            type: String,
            enum: ['win','invest'],
            required: true,
        }
    },{
        timestamps: true
    });

    return model('UserHistory', purchaseHistory);
};