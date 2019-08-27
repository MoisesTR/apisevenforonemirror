import mongoose, {Mongoose} from 'mongoose';
import dbConfig from '../global/config/database';
import path from 'path';
import logger from '../services/logger';

const basename = path.basename(__filename);

export class Core {
    public mongoose?: Mongoose;

    constructor() {
    }

    private static _instance: Core;

    private static get instance() {
        if (!this._instance) {
            this._instance = new Core();
        }
        return this._instance;
    }

    async connect() {
        console.log(dbConfig.mongoURI);
        this.mongoose = await mongoose
            .connect(dbConfig.mongoURI, {useNewUrlParser: true, useCreateIndex: true});
        logger.info('Mongo is Connected');
        process.on('SIGINT', () => {
            logger.error('The signal has been interrupt!');
            mongoose.connection.close(() => {
                logger.info('Interrupt Signal, the mongo connection has been close!');
                process.exit(1);
            });
        });
        // this.models.User.find({})
        //     .then(admins => {
        //         if (admins) {
        //             admins.forEach(admon => {
        //                 // console.log(admon);
        //                 // redisPub.lpush('admins', admon);
        //             });
        //         }
        //     })
        //     .catch(err => console.log(err));
            // .catch(err => {
            //     console.log(err);
            //     logger.error('Cannot be established a connection with the MongoDb server!', {metadata: {boot: true}});
            //     process.exit();
            // });
    }
}
