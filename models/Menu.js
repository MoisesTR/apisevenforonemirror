'use strict';
const {Schema, model} = require('mongoose');

const menuSchema = new Schema({
    path: {
        type: String,
        required: true,
        index: true
    },
    subMenus: [{
        nestedPath: String,
        enabled: true,
    }],
    enabled: {
        type: Boolean,
        required: true, 
        default: true
    }
},{
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

module.exports = model('Menu', menuSchema);