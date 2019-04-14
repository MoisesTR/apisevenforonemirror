'use strict';

module.exports = (Schema, model) => {

    const activityTypesSchema = new Schema({
        activityName: {
            type: String,
            required: true
        },
        activityDesc: {
            type: String,
            required: false
        }
    },{
        timestamps: true,
        writeConcern: {
            w: 0
        }
    });

    return model('ActivityTypes', activityTypesSchema);
};