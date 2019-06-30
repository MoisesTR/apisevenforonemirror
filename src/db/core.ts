import mongoose, {Mongoose} from 'mongoose';
import dbConfig from '../global/config/database';
import path from 'path';
import {Logger} from 'winston';
// Models
import UserModel from './models/User';
import CardModel from './models/Card';
import RoleModel from './models/Role';
import MenuModel from './models/Menu';
import GroupGameModel from './models/GroupGame';
import {ICardModel} from './interfaces/ICard';
import {IUserModel} from './interfaces/IUser';
import {IRoleModel} from './interfaces/IRole';
import {IMenuModel} from './interfaces/IMenu';
import {IGroupGameModel} from './interfaces/IGroupGame';
import {IActivityTypesModel} from './interfaces/IActivityTypes';
import ActivityTypes from './models/ActivityTypes';
import PurchaseHistory from './models/PurchaseHistory';
import {IPurchaseHistoryModel} from './interfaces/IPurchaseHistory';
import {INotificationModel} from './interfaces/INotification';
import Notification from './models/Notification';
import {redisPub} from '../redis/redis';

const basename = path.basename(__filename);

export interface IModels {
    User: IUserModel;
    Card: ICardModel;
    Role: IRoleModel;
    Menu: IMenuModel;
    GroupGame: IGroupGameModel;
    ActivityTypes: IActivityTypesModel;
    PurchaseHistory: IPurchaseHistoryModel;
    Notification: INotificationModel;
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
            PurchaseHistory: PurchaseHistory,
            Notification: Notification
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
                logger.info('Mongo is Connected');
                process.on('SIGINT', () => {
                    logger.error('The signal has been interrupt!');
                    mongoose.connection.close(() => {
                        logger.info('Interrupt Signal, the mongo connection has been close!');
                        process.exit(1);
                    });
                });
                this.models.User.find({})
                    .then(admins => {
                        if (admins) {
                            admins.forEach(admon => {
                                redisPub.lpush('admins', admon);
                            });
                        }
                    })
                    .catch(err => console.log(err));
                successCB();
            })
            .catch((err) => {
                console.log(err);
                logger.error('Cannot be established a connection with the MongoDb server!', {metadata: {boot: true}});
                process.exit();
            });
    }
}
