import Express, {NextFunction} from 'express';
import envVars from './global/environment';
import {Core} from './db/core';
// Internationalization
import i18n from 'i18n';
// middlewares
import * as ErrorMiddleware from './middlewares/error-middlewares';
import * as ThirdPartyMiddlewares from './middlewares/thirdparty-middlewares';
// Routers
import * as GroupGamesRouter from './routes/group-games';
import * as PaypalRouter from './routes/paypal';
import authRoutes from './routes/authRoutes';
import rolesRoutes from './routes/rolesRoutes';
import usersRoutes from './routes/usersRoutes';
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

    public dbCore: Core;

    private constructor() {
        this.dbCore = new Core();
        listenSockets();
        listenGroupSocket();
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
        GroupGamesRouter.register(this);
        PaypalRouter.register(this);
        //Auth routes
        app.use('/api/auth', authRoutes);
        // User routes
        app.use('/api/auth', usersRoutes);
        // Roles routes
        app.use('/api/auth', rolesRoutes);
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
