'use strict';

module.exports = (Schema, model) => {

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
        timestamps: true,
        writeConcern: {
            w: 0
        }
    });

    return model('UserActivityLog', userActivitySchema);
};