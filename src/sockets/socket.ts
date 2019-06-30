import socketIO from 'socket.io';
import redisAdapter from 'socket.io-redis';
import {IModels} from '../db/core';
import {redisPub, redisSub} from '../services/redis';
import {ObjectId} from 'bson';
import {ENotificationTypes} from '../db/models/Notification';
import {httpServer} from '../app';

export interface ISocketManagerAttributes {
    main: socketIO.Server;
    gameGroups?: socketIO.Namespace;
}

let main: socketIO.Server;
let gameGroups: socketIO.Namespace;

main = socketIO(httpServer, {
    // path: envVars.SOCKETIO_PATH
});
main.adapter(redisAdapter({pubClient: redisPub, subClient: redisSub}));
gameGroups = main.of('groups');


export const listenSockets = (models: IModels) => {
    console.log('Listen sockets');
    main.on('connection', socket => {
        console.log('Socket connection', socket);
        socket.on('disconnect', () => {
            console.log('Sockect disconnect!');
        });
    });

    // main.emit('notification', () => {
    //
    // });

    main.on('read-notification', () => {

    });

    models.Notification.watch({})
        .on('change', newNotification => {
            console.log('Notification change', newNotification);
        });

    models.User.watch({})
        .on('change', (user) => {
            console.log('User update', user);
        });
    // const GGNamespaces: GroupGameNamespace[] = [];
    // groups.forEach(group => {
    //     new GroupGameNamespace(group , main);
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
    gameGroups = main.of('groupGames');
    gameGroups.on('connection', async (socketGame) => {
        const groups = await models.GroupGame.find({});
        console.log('Sockect game connectado', socketGame);

    });

    gameGroups.on('joinGroup', () => {

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
    //     main.emit('notification', () => {
    //
    //     });
    // });
};


export {
    main,
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
