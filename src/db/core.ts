import mongoose, {Mongoose} from "mongoose";
import dbConfig from "../global/config/database";
import path from "path";
import {Logger} from "winston";
// Models
import UserModel  from "./models/User";
import CardModel  from "./models/Card";
import RoleModel  from "./models/Role";
import MenuModel  from "./models/Menu";
import GroupGameModel  from "./models/GroupGame";
import {ICardModel} from "./interfaces/Card";
import {IUserModel} from "./interfaces/User";
import {IRoleModel} from "./interfaces/Role";
import {IMenuModel} from "./interfaces/Menu";
import {IGroupGameModel} from "./interfaces/IGroupGame";
import {IActivityTypesModel} from "./interfaces/ActivityTypes";
import ActivityTypes from "./models/ActivityTypes";
import PurchaseHistory from "./models/PurchaseHistory";
import {IPurchaseHistoryModel} from "./interfaces/PurchaseHistory";
const basename = path.basename(__filename);

export interface IModels {
    User: IUserModel;
    Card: ICardModel;
    Role: IRoleModel;
    Menu: IMenuModel;
    GroupGame: IGroupGameModel;
    ActivityTypes: IActivityTypesModel;
    PurchaseHistory: IPurchaseHistoryModel;
}

export class Core {
    public models: IModels;
    public mongoose?: Mongoose;

    constructor() {
        this.models = {
            User: UserModel,
            Card: CardModel,
            Menu: MenuModel,
            Role: RoleModel,
            GroupGame: GroupGameModel,
            ActivityTypes: ActivityTypes,
            PurchaseHistory: PurchaseHistory
        };
    }

    private static _instance: Core;

    private static get instance() {
        if (!this._instance) {
            this._instance = new Core();
        }
        return this._instance;
    }

    async connect(logger: Logger, successCB: Function) {
        console.log(dbConfig.mongoURI);
        mongoose.connect(dbConfig.mongoURI, {useNewUrlParser: true, useCreateIndex: true})
            .then((mongo) => {
                this.mongoose = mongo;
                logger.info("Mongo is Connected");
                process.on("SIGINT", () => {
                    logger.error("The signal has been interrupt!");
                    mongoose.connection.close(() => {
                        logger.info("Interrupt Signal, the mongo connection has been close!");
                    });
                });
                successCB();
            })
            .catch((err) => {
                console.log(err);
                logger.error("Cannot be established a connection with the MongoDb server!", {metadata: {boot: true}});
                process.exit();
            });
    }
}
