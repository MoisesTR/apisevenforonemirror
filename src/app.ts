import Express from 'express';
import ENV from './global/environment';
import http from 'http';
import {debug} from 'winston';
import EnvVar from './global/environment';

const app = Express();
app.set('port', ENV.SERVER_PORT);

/**
 * Event listener for HTTP server "listening" event.
 */
const onListening = () => {
    const addr = httpServer.address() || '';
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
};

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: any) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(EnvVar.SERVER_PORT + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(EnvVar.SERVER_PORT + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

const httpServer = new http.Server(app);
httpServer.on('error', onError);
httpServer.on('listening', onListening);
httpServer.on('close', () => console.log('closing'));

export {app, httpServer};
