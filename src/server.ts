import Express, {NextFunction} from 'express';
import ENV from './global/environment';
import socketIO from 'socket.io';
import http from 'http';
import {Logger} from "winston";
import MyLogger from "./services/logger";
import envVars from "./global/environment";
import {Core} from "./db/core";

const debug = require('debug')('sevenforoneapi:server');


// import * as socket from '../sockets/socket';


export default class Server {

    private static _intance: Server;

    public app: Express.Application;
    public logger: Logger;
    public port: number;
    public dbCore: Core;
    public io: socketIO.Server;
    private httpServer: http.Server;


    private constructor() {

        this.app = Express();
        this.app.set('port', ENV.SERVER_PORT);
        this.port = ENV.SERVER_PORT;

        this.httpServer = new http.Server(this.app);
        this.httpServer.on('error', onError);
        this.httpServer.on('listening', this.onListening);
        this.httpServer.on('close', () => console.log('closing'));

        this.io = socketIO(this.httpServer);
        const MyLogg = new MyLogger('');
        this.logger = MyLogg.logger;
        this.dbCore = new Core();
        // this.escucharSockets();
    }

    public static get instance() {
        return this._intance || (this._intance = new this());
    }


    /**
     * Event listener for HTTP server "listening" event.
     */

    onListening = () => {
        const addr = this.httpServer.address() || "";
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        debug('Listening on ' + bind);
    };

    public basicMiddlewares() {
        //Configuracion cabeceras y cors
        this.app.use((req: Express.Request, res: Express.Response, next: NextFunction) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
            res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
            next();
        });

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
