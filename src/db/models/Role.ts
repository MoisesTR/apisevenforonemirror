'use strict';

import {model, Schema} from 'mongoose';
import {IRoleDocument, IRoleModel} from '../interfaces/IRole';

export enum ERoles {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

const validRoles = {
    values: [ERoles.ADMIN, ERoles.USER],
    message: '{VALUE} no es un rol permitido',
};

const roleModel = new Schema(
    {
        name: {
            type: String,
            unique: true,
            required: true,
            enum: validRoles,
        },
        description: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

export default model<IRoleDocument, IRoleModel>('Role', roleModel);
