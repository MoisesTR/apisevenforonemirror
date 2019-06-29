'use strict';

import {model, Schema} from "mongoose";
import {IRoleDocument} from "../interfaces/IRole";

export enum ERoles {
    ADMIN =  "ADMIN",
    USER = "USER"
}

const validRoles = {
    values: ['ADMIN', 'USER'],
    message: '{VALUE} it is not a permitted role'
};

const roleModel = new Schema({
    name: {
        type: String,
        unique: true,
        required: true,
        enum: validRoles
    },
    description: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

export default model<IRoleDocument>('Role', roleModel);
