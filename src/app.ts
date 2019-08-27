import Express from 'express';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import ENV from './global/environment';
import http from 'http';
import {debug} from 'winston';
import EnvVar from './global/environment';

const app = Express();
app.set('port', ENV.SERVER_PORT);

// Limit Request from same API
const limiter = rateLimit({
    max: 600,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Data sanitization against noSQL query injection
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());

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
