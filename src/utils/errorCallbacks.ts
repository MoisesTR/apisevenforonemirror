import http from 'http';
import {debug} from 'winston';
import EnvVar from '../global/environment';

/**
 * Event listener for HTTP server "listening" event.
 */
export const onListening = (httpServer: http.Server) => () => {
    const addr = httpServer.address() || '';
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
};

/**
 * Event listener for HTTP server "error" event.
 */
export function onError(error: any) {
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
