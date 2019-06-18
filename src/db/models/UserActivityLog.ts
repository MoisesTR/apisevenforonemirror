'use strict';
import {model, Schema} from "mongoose";
import {IUserActivityLogDocument, IUserActivityModel} from "../interfaces/UserActivityLog";

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
}, {
    timestamps: true,
    writeConcern: {
        w: 0
    }
});

userActivitySchema.statics.byUser = function(userId: string) {
    return this.model.find({userId: userId})
};

export default  model<IUserActivityLogDocument,IUserActivityModel>('UserActivityLog', userActivitySchema);
