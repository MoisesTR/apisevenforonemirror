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
        activityId: {
            type: Schema.Types.ObjectId,
            ref: 'ActivityTypes',
            required: true
        },
    },{
        timestamps: true,
        writeConcern: {
            w: 0
        }
    });

    userActivitySchema.statics.byUser = ( userId ) => {
        this.model.find({userId: userId})
    };

    return model('UserActivityLog', userActivitySchema);
};