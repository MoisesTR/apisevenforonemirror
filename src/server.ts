import Express, {NextFunction} from 'express';
import ENV from './global/environment';
import envVars from './global/environment';
import socketIO from 'socket.io';
import http from 'http';
import {Logger} from 'winston';
import MyLogger from './services/logger';
import {Core} from './db/core';
// Internationalization
import i18n from "i18n";
// middlewares
import * as ErrorMiddleware from './middlewares/error-middlewares';
import * as ThirdPartyMiddlewares from './middlewares/thirdparty-middlewares';
// Routers
import * as AuthRouter from './routes/authRoutes';
import * as GroupGamesRouter from './routes/group-games';
import * as PaypalRouter from './routes/paypal';
import * as JWT from './services/jwt';
import {IjwtResponse} from './services/jwt';
// Socket
import {SocketManager} from './sockets/socket';

const debug = require('debug')('sevenforoneapi:server');

i18n.configure({
    // setup some locales - other locales default to en silently
    locales:['en', 'iw'],

    // where to store json files - defaults to './locales' relative to modules directory
    directory: __dirname + '/locales',

    defaultLocale: 'en',

    // sets a custom cookie name to parse locale settings from  - defaults to NULL
    cookie: 'lang',
});

export default class Server {

    private static _intance: Server;

    public app: Express.Application;
    public logger: Logger;
    public port: number;
    public dbCore: Core;
    public io: socketIO.Server;
    public jwt: IjwtResponse;
    public socketMng: SocketManager;
    private httpServer: http.Server;

    private constructor() {

        this.app = Express();
        this.app.set('port', ENV.SERVER_PORT);
        this.port = ENV.SERVER_PORT;
        this.httpServer = new http.Server(this.app);
        this.httpServer.on('error', onError);
        this.httpServer.on('listening', this.onListening);
        this.httpServer.on('close', () => console.log('closing'));

        this.io = socketIO(this.httpServer, {
            path: '/not_sock3t5s'
        });
        const myLogg = new MyLogger(__dirname);
        this.logger = myLogg.logger;
        this.dbCore = new Core();
        this.jwt = JWT.get(this);
        this.socketMng = new SocketManager(this.httpServer);
        this.socketMng.listenSockets(this.dbCore.models);
        this.socketMng.listenGroupSocket(this.dbCore.models);
    }

    public static get instance() {
        return this._intance || (this._intance = new this());
    }


    /**
     * Event listener for HTTP server "listening" event.
     */

    onListening() {
        const addr = this.httpServer.address() || '';
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        debug('Listening on ' + bind);
    }

    public basicMiddlewares() {
        //Configuracion cabeceras y cors
        this.app.use((req: Express.Request, res: Express.Response, next: NextFunction) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, ' +
                'X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
            res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
            next();
        });
        this.app.use(i18n.init);
        ThirdPartyMiddlewares.apply(this.app, __dirname);
    }

    public errorMiddlewares() {
        ErrorMiddleware.apply(this.app);
    }

    public registerRouter() {
        AuthRouter.register(this);
        GroupGamesRouter.register(this);
        PaypalRouter.register(this);
    }

    start(callback: (port: number) => void) {
        this.httpServer.listen(this.port, () => callback(this.port));
    }

    private escucharSockets() {

        console.log('Escuchando conexiones - sockets');

        // this.io.on('connection', cliente => {
        //
        //     // Conectar cliente
        //     socket.conectarCliente( cliente );
        //
        //     // Configurar usuario
        //     socket.configurarUsuario( cliente, this.io );
        //
        //     // Mensajes
        //     socket.mensaje( cliente, this.io );
        //
        //     // Desconectar
        //     socket.desconectar( cliente );
        //
        //
        // });

    }

}


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
            console.error(envVars.SERVER_PORT + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(envVars.SERVER_PORT + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}
