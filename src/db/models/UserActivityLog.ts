'use strict';
import {model, Schema} from 'mongoose';
import {IUserActivityLogDocument} from '../interfaces/IUserActivityLog';
import {EModelNames} from '../interfaces/EModelNames';

const userActivitySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: EModelNames.User,
        },
        userSnapshot: {
            type: Object,
            required: true,
        },
        activityId: {
            type: Schema.Types.ObjectId,
            ref: EModelNames.ActivityTypes,
            required: true,
        },
    },
    {
        timestamps: true,
        writeConcern: {
            w: 0,
        },
    },
);

userActivitySchema.statics.byUser = function(userId: string) {
    return this.model.find({userId: userId});
};

export default model<IUserActivityLogDocument>(EModelNames.UserActivity, userActivitySchema);
