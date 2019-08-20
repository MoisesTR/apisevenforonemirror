import dotenv from 'dotenv';
import path from 'path';
// That's going to catch all the uncaught errors, for example
// undefined variables
process.on('uncaughtException', err => {
    console.log('UNCAUGHT REJECTION', 'Shutting down...');
    console.log(err);
    // Code: 0 success
    // 1 - uncaught exception
    process.exit(1);
});

dotenv.config({path: path.resolve(__dirname, '..', '.env')});
import {httpServer, app} from './app';
import Server from './server';
import User from './db/models/User';
import Role, {ERoles} from './db/models/Role';
import AppError from './classes/AppError';
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
server.dbCore.connect(server.logger, () => {
    server.start((port: number) => {
        const adminRole = Role.findOne({name: ERoles.ADMIN});
        const userRole = Role.findOne({name: ERoles.USER});
        if (!adminRole) {
            throw new AppError('The server cannot start doesn\'t be find the admin role in the database.',500)
        }
        if (!userRole) {
            throw new AppError('The server cannot start doesn\'t be find the user role in the database.',500)
        }
        app.locals.roleAdmin = adminRole;
        app.locals.roleUser = userRole;
        server.logger.info(`The API is already running, on the ${port}`, {port});
    });
});
