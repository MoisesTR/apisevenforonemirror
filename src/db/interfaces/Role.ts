import {Document, Model} from "mongoose";

export interface IRole {
    name: string;
    description: string;
}

export interface IRoleDocument extends IRole, Document {}

export interface IRoleModel extends Model<IRoleDocument>{
}
