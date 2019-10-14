import mongoose, {Mongoose} from 'mongoose';
import dbConfig from '../global/config/database';
import logger from '../services/logger';

export class Core {
    public mongoose?: Mongoose;

    constructor() {}

    private static _instance: Core;

    private static get instance() {
        if (!this._instance) {
            this._instance = new Core();
        }
        return this._instance;
    }

    async connect() {
        console.log(dbConfig.mongoURI);
        this.mongoose = await mongoose.connect(dbConfig.mongoURI, {
            useNewUrlParser: true,
            useCreateIndex: true,
        });
        logger.info('Mongo is Connected');
        process.on('SIGINT', () => {
            logger.error('The signal has been interrupt!');
            mongoose.connection.close(() => {
                logger.info('Interrupt Signal, the mongo connection has been close!');
                process.exit(1);
            });
        });
    }
}
