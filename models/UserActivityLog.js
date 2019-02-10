'use strict';
const {Schema, model} = require('mongoose');

const userActivitySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true, 
        ref: 'User'
    },
    userSnapshot: {
        type: Object,
        required: true
    },
    activityName: {
        type: String, 
        required: true
    },
},{
    timestamps: {
        createdAt: 'createdAt'
    }
});

module.exports = model('UserActivityLog', userActivitySchema);