'use strict';

import {model, Schema} from "mongoose";
import {IActivityTypesDocument} from "../interfaces/IActivityTypes";

const activityTypesSchema = new Schema({
    activityName: {
        type: String,
        required: true
    },
    activityDesc: {
        type: String,
        required: false
    }
}, {
    timestamps: true,
    writeConcern: {
        w: 0
    }
});

export default model<IActivityTypesDocument>('activityTypes', activityTypesSchema);
