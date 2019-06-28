import { Socket } from "socket.io";
import Express from "express";
import socketIO from "socket.io";
import redisAdapter from "socket.io-redis";
import Redis from "ioredis";
import envVars from "../global/environment";
import {GroupGameNamespace} from "../classes/GroupGameNamespace";
import {IModels} from "../db/core";

export interface ISocketManagerAttributes {
    main: socketIO.Server;
    groupNamespaces?: GroupGameNamespace[];
}

export class SocketManager implements ISocketManagerAttributes {
    main: socketIO.Server;
    groupNamespaces?: GroupGameNamespace[];

    constructor(app: Express.Application, redis: Redis.Redis) {
        this.main = socketIO(app, {
            path: envVars.SOCKETIO_PATH
        });
        this.main.adapter(redisAdapter({ pubClient: redis, subClient: redis }));
    }

    public async listenSockets( models: IModels ) {
        this.main.on("connection" , socket => {


            socket.on("disconnect", () => {

            });
        });

        this.main.emit("notification", () => {

        });

        this.main.on("read-notification", () => {

        });

        const groups = await models.GroupGame.find({});
        // const GGNamespaces: GroupGameNamespace[] = [];
        // groups.forEach(group => {
        //     new GroupGameNamespace(group, this.main);
        // });
    }
}
// import { UsuariosLista } from '../classes/usuarios-lista';
// import { Usuario } from '../classes/usuario';
//
//
// export const usuariosConectados = new UsuariosLista();
//
//
// export const conectarCliente = ( cliente: Socket ) => {
//
//     const usuario = new Usuario( cliente.id );
//     usuariosConectados.agregar( usuario );
//
// }
//
//
// export const desconectar = ( cliente: Socket ) => {
//
//     cliente.on('disconnect', () => {
//         console.log('Cliente desconectado');
//
//         usuariosConectados.borrarUsuario( cliente.id );
//
//     });
//
// }
//
//
// // Escuchar mensajes
// export const mensaje = ( cliente: Socket, io: socketIO.Server ) => {
//
//     cliente.on('mensaje', (  payload: { de: string, cuerpo: string }  ) => {
//
//         console.log('Mensaje recibido', payload );
//
//         io.emit('mensaje-nuevo', payload );
//
//     });
//
// }
//
// // Configurar usuario
// export const configurarUsuario = ( cliente: Socket, io: socketIO.Server ) => {
//
//     cliente.on('configurar-usuario', (  payload: { nombre: string }, callback: Function  ) => {
//
//         usuariosConectados.actualizarNombre( cliente.id, payload.nombre );
//
//         callback({
//             ok: true,
//             mensaje: `Usuario ${ payload.nombre }, configurado`
//         });
//     });
//
// }
//
