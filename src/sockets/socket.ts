import socketIO from 'socket.io';
import redisAdapter from 'socket.io-redis';
import {IModels} from '../db/core';
import {redisPub, redisSub} from '../redis/redis';
import {ObjectId} from 'bson';
import {ENotificationTypes} from '../db/models/Notification';
import {httpServer} from '../app';
import * as socketPrincipalEvents from './events/mainSocket';
import {socketKey} from '../redis/keys/dynamics';
import * as socketGamevents from './events/gameSocket';

export interface ISocketManagerAttributes {
    main: socketIO.Server;
    gameGroups?: socketIO.Namespace;
}

let mainSocket: socketIO.Server;
let gameGroups: socketIO.Namespace;

mainSocket = socketIO(httpServer, {
    // path: envVars.SOCKETIO_PATH
    serveClient: true
});
mainSocket.adapter(redisAdapter({pubClient: redisPub, subClient: redisSub}));
gameGroups = mainSocket.of('groups');


export const listenSockets = (models: IModels) => {
    console.log('Listen sockets');
    mainSocket.on('connection', socket => {
        console.log('Socket principal connection', 'socket.client');
        socket.on('disconnect', () => {
            console.log('Sockect principal disconnect!');
            // @ts-ignore
            mainSocket.of('/').adapter.clients((err, clients) => {
                console.log('clients', clients);
                mainSocket.emit(socketPrincipalEvents.PLAYERS_ONLINE, {quantity: clients.length});
            });
        });

        // @ts-ignore
        mainSocket.of('/').adapter.clients((err, clients) => {
            console.log('clients', clients);
            mainSocket.emit(socketPrincipalEvents.PLAYERS_ONLINE, {quantity: clients.length});
        });

        socket.on('REGISTER_USER', (username) => {
            console.log('Registrando user', username);
            redisPub.get(socketKey(username))
                .then(socketID => {
                    if (!!socketID) {
                        // Esto es emitido solo a la ventana anterior
                        socket.to(socketID).emit(socketPrincipalEvents.CLOSE_SESSION);
                        if (!!mainSocket.sockets.connected[socketID] && (socketID != socket.id)) {
                            !!mainSocket.sockets.connected[socketID].disconnect();
                        }
                    }
                    redisPub.set(socketKey(username), socket.id)
                        .then(() => {
                            console.log('Key is set');
                        })
                        .catch(() => {
                            console.log('no se pudo asociar el user al socket');
                        });
                    console.log('Socket id', socketID);
                }).catch(err => {
                console.log('Error', err);
            });
        });
    });

    // On read action change notification state
    mainSocket.on('read-notification', (notifiactionId: ObjectId) => {

    });

    // Watch changes on notification collection
    models.Notification.watch({})
        .on('change', newNotification => {
            console.log('Notification change', newNotification);
        });

    // Watch changes on Users collection
    models.User.watch({})
        .on('change', (user) => {
            console.log('User update', user);
        });
    // const GGNamespaces: GroupGameNamespace[] = [];
    // groups.forEach(group => {
    //     new GroupGameNamespace(group , mainSocket);
    // });
    const newnoti = new models.Notification({
        userId: new ObjectId(),
        content: ' alo',
        notificationType: ENotificationTypes.WIN
    });
    newnoti.save()
        .then(() => console.log('Guardado'));
};

export const listenGroupSocket = (models: IModels) => {
    gameGroups = mainSocket.of('groupGames');
    gameGroups.on('connection', async (socketGame) => {
        const groups = await models.GroupGame.find({});
        console.log('Sockect game connectado', socketGame.id);
        socketGame.on('disconnect', () => {
            console.log('Desconectado del socket de juegos');
        });
    });

    gameGroups.on(socketGamevents.JOIN_GROUP, () => {

    });
    // Emitir siempre que el usuario gane sin importar el grupo
    gameGroups.emit('update-purchase-history-user',);

    // emitir ganadores en el momento
    gameGroups.emit('top-winners-globals');


    //cuando un usuario se registra en un grupo emitir un evento al cliente
    //  con el recien ingresado


    //una solo pestana por user
    gameGroups.emit('');


    //marcar notifiaciones como leidas
    //notificacion
    // gameGroups.emit('confetti-celebration')
    // this.gameGroups.emit('winGame', () => {
    //     mainSocket.emit('notification', () => {
    //
    //     });
    // });
};


export {
    mainSocket,
    gameGroups
};
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
