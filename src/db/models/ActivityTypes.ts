'use strict';

import {model, Schema} from 'mongoose';
import {IActivityTypesDocument} from '../interfaces/IActivityTypes';
import {EModelNames} from '../interfaces/EModelNames';

const activityTypesSchema = new Schema(
    {
        activityName: {
            type: String,
            required: true,
        },
        activityDesc: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
        writeConcern: {
            w: 0,
        },
    },
);

export default model<IActivityTypesDocument>(EModelNames.ActivityTypes, activityTypesSchema);
