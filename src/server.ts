import Express, {NextFunction} from 'express';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import http from 'http';
// Internationalization
import i18n from 'i18n';
import ENV from './global/environment';
import envVars from './global/environment';
import cors from 'cors';
import {Core} from './db/core';
// middlewares
import * as ErrorMiddleware from './middlewares/error-middlewares';
import * as ThirdPartyMiddlewares from './middlewares/thirdparty-middlewares';
// Routers
import GroupGamesRouter from './routes/group-games';
import PaypalRouter from './routes/paypal';
import authRoutes from './routes/authRoutes';
import rolesRoutes from './routes/rolesRoutes';
import usersRoutes from './routes/usersRoutes';
// Socket
import {listenGroupSocket, listenSockets} from './sockets/socket';
import {onError, onListening} from './utils/errorCallbacks';
import * as mongoose from 'mongoose';

const app = Express();
app.enable('trust proxy');
app.set('port', ENV.SERVER_PORT);

app.use(cors(
  {
      origin: 'http://localhost:4200',
      credentials: true
  }
));

// app.options('*', cors());
// Limit Request from same API
const limiter = new rateLimit({
    max: 600,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Data sanitization against noSQL query injection
app.use(mongoSanitize());
// Data sanitization against XSS
// app.use(xss());


const httpServer = new http.Server(app);
httpServer.on('error', onError);
httpServer.on('listening', onListening(httpServer));
httpServer.on('close', () => console.log('closing'));

// const debug = require('debug')('sevenforoneapi:server');

i18n.configure({
    // setup some locales - other locales default to en silently
    locales: ['en', 'iw'],

    // where to store json files - defaults to './locales' relative to modules directory
    directory: __dirname + '/locales',

    defaultLocale: 'en',

    // sets a custom cookie name to parse locale settings from  - defaults to NULL
    cookie: 'lang',
});

export {
    app,
    httpServer
};

export default class Server {
    private static _intance: Server;

    public dbCore: Core;

    private constructor() {
        this.dbCore = new Core();
        listenSockets(httpServer);
        listenGroupSocket();
    }

    public static get instance() {
        return this._intance || (this._intance = new this());
    }

    public basicMiddlewares() {
        //Configuracion cabeceras y cors
        app.use((req: Express.Request, res: Express.Response, next: NextFunction) => {
            res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
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
        app.use('/api', GroupGamesRouter);
        app.use('/api', PaypalRouter);
        //Auth routes
        app.use('/api/auth', authRoutes);
        // User routes
        app.use('/api/users', usersRoutes);
        // Roles routes
        app.use('/api/roles', rolesRoutes);
    }

    start(callback: (port: number) => void) {
        httpServer.listen(envVars.SERVER_PORT, () => callback(envVars.SERVER_PORT));
        process.on('SIGTERM', () => {
            console.log('SIGTERM CATCHED: closing server..');
            httpServer.close(() => {
                mongoose.disconnect(() => {
                    process.exit(0);
                });
            });
        });
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
