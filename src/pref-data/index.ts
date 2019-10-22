import dotenv from 'dotenv';
import path from 'path';
dotenv.config({path: path.resolve(__dirname, '../', '../', '.env')});
import mongoose from 'mongoose';
import dbConfig from '../global/config/database';
import {Role} from '../db/models';
// Importing data
// @ts-ignore
import sampleRoles from './sample-data/roles.json';
import logger from '../services/logger';

// IMPORT DEFAULT DATA INTO DB
const importData = async () => {
    try {
        logger.info('ImpData: Importing Data');
        await Role.create(sampleRoles);
        logger.info('ImpData: Data successfully loaded!');
    } catch (err) {
        logger.info('ImpdData: Error importing all Data', err);
        process.exit();
    }
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
    try {
        logger.info('ImpdData: Deleting all Data');
        await mongoose.connection.db.dropDatabase();
    } catch (err) {
        logger.info('ImpdData: Error Deleting all Data', err);
        process.exit();
    }
};

// IMPORT TEST DATA INTO DB
const importTestData = async () => {
    logger.info('ImpdData: Preparing data for Test');
};

async function doAll() {
    await mongoose.connect(dbConfig.mongoURI, {
        useNewUrlParser: true,
        useCreateIndex: true,
    });

    if (process.argv.includes('--delete')) {
        await deleteData();
    }

    if (process.argv.includes('--import')) {
        await importData();
    }

    if (process.argv.includes('--testData')) {
        await importTestData();
    }

    await mongoose.disconnect();
    process.exit(0);
}

doAll();
