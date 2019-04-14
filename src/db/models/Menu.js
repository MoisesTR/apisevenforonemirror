'use strict';

module.exports = (Schema, model) => {

    const menuSchema = new Schema({
        path: {
            type: String,
            required: true,
            index: true
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

    return model('Menu', menuSchema);
};