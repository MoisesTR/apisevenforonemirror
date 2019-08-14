import Express, {NextFunction} from 'express';
import envVars from './global/environment';
import {Logger} from 'winston';
import MyLogger from './services/logger';
import {Core} from './db/core';
// Internationalization
import i18n from 'i18n';
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
import {app, httpServer} from './app';
import {listenGroupSocket, listenSockets} from './sockets/socket';

const debug = require('debug')('sevenforoneapi:server');

i18n.configure({
    // setup some locales - other locales default to en silently
    locales: ['en', 'iw'],

    // where to store json files - defaults to './locales' relative to modules directory
    directory: __dirname + '/locales',

    defaultLocale: 'en',

    // sets a custom cookie name to parse locale settings from  - defaults to NULL
    cookie: 'lang',
});

export default class Server {
    private static _intance: Server;

    public logger: Logger;
    public dbCore: Core;
    public jwt: IjwtResponse;

    private constructor() {
        const myLogg = new MyLogger(__dirname);
        this.logger = myLogg.logger;
        this.dbCore = new Core();
        this.jwt = JWT.get(this);
        listenSockets(this.dbCore.models);
        listenGroupSocket(this.dbCore.models);
    }

    public static get instance() {
        return this._intance || (this._intance = new this());
    }

    public basicMiddlewares() {
        //Configuracion cabeceras y cors
        app.use((req: Express.Request, res: Express.Response, next: NextFunction) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header(
                'Access-Control-Allow-Headers',
                'Authorization, X-API-KEY, Origin, ' + 'X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method',
            );
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
            res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
            next();
        });
        ThirdPartyMiddlewares.apply(app, __dirname);
    }

    public errorMiddlewares() {
        ErrorMiddleware.apply(app);
    }

    public registerRouter() {
        AuthRouter.register(this);
        GroupGamesRouter.register(this);
        PaypalRouter.register(this);
    }

    start(callback: (port: number) => void) {
        httpServer.listen(envVars.SERVER_PORT, () => callback(envVars.SERVER_PORT));
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
