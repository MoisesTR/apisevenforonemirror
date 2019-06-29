import {Document, Model} from "mongoose";

export interface IMenu {
    path: string;
    subMenus: {nestedPath: string, enabled: boolean}[];
    enabled: boolean;
}
export interface IMenuDocument extends Document, IMenu{
}

export interface IMenuModel extends Model<IMenuDocument>{
}
