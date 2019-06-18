'use strict';

    import {model, Schema} from "mongoose";
import {IMenuDocument} from "../interfaces/Menu";

const menuSchema = new Schema({
        path: {
            type: String,
            required: true,
            index: true
        },
        subMenus: [{
            nestedPath: String,
            enabled: {
                type: Boolean,
                required: true,
                default: true
            },
        }],
        enabled: {
            type: Boolean,
            required: true,
            default: true
        }
    },{
        timestamps: true
    });

export default model<IMenuDocument>('Menu', menuSchema);
