import mongoose from 'mongoose';
import dbConfig from '../global/config/database';
import logger from '../services/logger';

export const connnectDb = async () => {
    console.log(dbConfig.mongoURI);
    await mongoose.connect(dbConfig.mongoURI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        autoIndex: process.env.NODE_ENV !== 'production',
    });
    logger.info('Mongo is Connected');
    process.on('SIGTERM', () => {
        logger.error('The signal has been interrupt!');
        mongoose.connection.close(() => {
            logger.info('Interrupt Signal, the mongo connection has been close!');
            process.exit(1);
        });
    });
};
