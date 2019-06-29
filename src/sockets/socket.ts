import socketIO from 'socket.io';
import Express from 'express';
import redisAdapter from 'socket.io-redis';
import envVars from '../global/environment';
import {IModels} from '../db/core';
import {redis} from '../services/redis';
import Http from 'http';

export interface ISocketManagerAttributes {
    main: socketIO.Server;
    gameGroups?: socketIO.Namespace;
}

export class SocketManager implements ISocketManagerAttributes {
    main: socketIO.Server;
    gameGroups?: socketIO.Namespace;

    constructor(app: Http.Server) {
        this.main = socketIO(app, {
            path: envVars.SOCKETIO_PATH
        });
        this.gameGroups = this.main.of('groups');
        this.main.adapter(redisAdapter({pubClient: redis, subClient: redis}));
    }

    public async listenSockets(models: IModels) {
        this.main.on('connection', socket => {


            socket.on('disconnect', () => {

            });
        });

        // this.main.emit('notification', () => {
        //
        // });

        this.main.on('read-notification', () => {

        });


        // const GGNamespaces: GroupGameNamespace[] = [];
        // groups.forEach(group => {
        //     new GroupGameNamespace(group, this.main);
        // });
    }

    public listenGroupSocket(models: IModels) {
        this.gameGroups = this.main.of('groupGames');
        this.gameGroups.on('connection', async (socketGame) => {
            const groups = await models.GroupGame.find({});

        });

        this.gameGroups.on('joinGroup', () => {

        });

        // this.gameGroups.emit('winGame', () => {
        //     this.main.emit('notification', () => {
        //
        //     });
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
