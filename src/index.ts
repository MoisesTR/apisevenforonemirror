import dotenv from 'dotenv';
import path from 'path';
console.log('Environment', process.env.NODE_ENV)
dotenv.config({path: path.resolve(__dirname, '../', '.env')});
import {app, httpServer} from './app';
import Server from './server';
import Role, {ERoles} from './db/models/Role';
import AppError from './classes/AppError';
import logger from './services/logger';
// That's going to catch all the uncaught errors, for example
// undefined variables
process.on('uncaughtException', err => {
    console.log('UNCAUGHT REJECTION', 'Shutting down...');
    console.log(err);
    // Code: 0 success
    // 1 - uncaught exception
    process.exit(1);
});

console.log(path.resolve(__dirname, '../', '.env'))
const server = Server.instance;
console.log(path.resolve(__dirname, '..', '.env'));

// That's is going to catch all the unhandled errors on the application
// to avoid the application crash
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION', 'Shutting down...');
    console.log(err);
    // Code: 0 success
    // 1 - uncaught exception
    if (httpServer) {
        httpServer.close(() => {
            // Give time to server to complete all pending request!
            process.exit(1);
        });
    } else {
        console.log('HttpServer no instanciado');
    }
});

server.basicMiddlewares();
server.registerRouter();
server.errorMiddlewares();
server.dbCore.connect()
    .then(async () => {
        const adminRole = await Role.findOne({name: ERoles.ADMIN});
        const userRole = await Role.findOne({name: ERoles.USER});
        if (!adminRole) {
            throw new AppError('The server cannot start doesn\'t be find the admin role in the database.', 500);
        }
        if (!userRole) {
            throw new AppError('The server cannot start doesn\'t be find the user role in the database.', 500);
        }
        app.locals.roleAdmin = adminRole;
        app.locals.roleUser = userRole;
        return {};
    }).then(() => {
    server.start((port: number) => {
        logger.info(`The API is already running, on the ${port}`, {port});
    });
});
