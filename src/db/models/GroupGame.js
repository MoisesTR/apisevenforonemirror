'use strict';

module.exports = ( Schema, model) => {

    const groupSchema = new Schema({
        initialInvertion: {
            type: Schema.Types.Number,
            required: true
        },
        subMenus: [{
            nestedPath: String,
            enabled: {
                type: Boolean,
                required: true,
                default: true
            },
        }],
        enabled: {
            type: Boolean,
            required: true,
            default: true
        }
    },{
        timestamps: true
    });

    return model('GroupGame', groupSchema);
};