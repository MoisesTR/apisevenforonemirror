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
import {httpServer} from './app';
import Server from './server';
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
        server.logger.info(`The API is already running, on the ${port}`, {port});
    });
});
