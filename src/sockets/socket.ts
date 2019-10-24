import socketIO from 'socket.io';
import redisAdapter from 'socket.io-redis';
import http from 'http';
import {redisPub, redisSub} from '../redis/redis';
import {ObjectId} from 'bson';
import {EMainEvents} from './constants/main';
import {EGameEvents} from './constants/game';
import DynamicKey from '../redis/keys/dynamics';
import * as game from '../controllers/game';

let mainSocket: socketIO.Server;
let gameGroups: socketIO.Namespace;

const options: socketIO.ServerOptions = {
    serveClient: true,
    path: process.env.SOCKETIO_PATH || '/seven/socket.io',
};

mainSocket = socketIO(options);

mainSocket.adapter(redisAdapter({pubClient: redisPub, subClient: redisSub}));
gameGroups = mainSocket.of('groups');

export const listenSockets = (httpServer: http.Server) => {
    console.log('Listen sockets');
    mainSocket.attach(httpServer);
    mainSocket.on('connection', socket => {
        console.log('Socket principal connection', 'socket.client');
        socket.on('disconnect', () => {
            console.log('Sockect principal disconnect!');
            // @ts-ignore
            mainSocket.of('/').adapter.clients((err, clients) => {
                console.log('clients conectados', clients);
                mainSocket.emit(EMainEvents.PLAYERS_ONLINE, {quantity: clients.length});
            });
            socket.leave('ADMIN');
        });

        // An admin has recently connected
        socket.on(EMainEvents.JOIN_ADMIN_ROOM, () => {
            console.log('Se unio un administrador!');
            socket.join('ADMIN');
        });

        // @ts-ignore
        mainSocket.of('/').adapter.clients((err, clients) => {
            console.log('clients conectados', clients);
            mainSocket.emit(EMainEvents.PLAYERS_ONLINE, {quantity: clients.length});
        });

        socket.on(EMainEvents.REGISTER_USER, username => {
            console.log('Registrando user', username, socket.id);
            redisPub
                .hget(DynamicKey.hash.socketsUser(username), 'main')
                .then(socketID => {
                    if (!!socketID) {
                        // Esto es emitido solo a la ventana anterior
                        socket.to(socketID).emit(EMainEvents.CLOSE_SESSION);
                        if (!!mainSocket.sockets.connected[socketID] && socketID !== socket.id) {
                            mainSocket.sockets.connected[socketID].disconnect();
                        }
                    }
                    redisPub
                        .hset(DynamicKey.hash.socketsUser(username), 'main', socket.id)
                        .then(() => {
                            console.log('Key is set', socket.id);
                        })
                        .catch(() => {
                            console.log('no se pudo asociar el user al socket');
                        });
                    console.log('Socket id', socketID);
                })
                .catch(err => {
                    console.log('Error', err);
                });
        });
    });

    // TODO: fix all before that
    // On read action change notification state
    // mainSocket.on('read-notification', (notifiactionId: ObjectId) => {});

    // Watch changes on Users collection
    // models.User.watch({}).on('change', user => {
    //     console.log('User update', user);
    // });
    // const GGNamespaces: GroupGameNamespace[] = [];
    // groups.forEach(group => {
    //     new GroupGameNamespace(group , mainSocket);
    // });
};

export const listenGroupSocket = () => {
    gameGroups = mainSocket.of('groupGames');
    gameGroups.on('connection', async socketGame => {
        console.log('Socket game connectado', socketGame.id);
        const gameSocketId = await redisPub.hget(
            DynamicKey.hash.socketsUser(socketGame.handshake.query.userName),
            'game',
        );
        if (!!gameSocketId && !!gameGroups.sockets[gameSocketId]) {
            gameGroups.sockets[gameSocketId].disconnect(true);
            console.log('Ya tenes una sesion abierta', gameSocketId, gameGroups.sockets);
        }
        await redisPub.hset(
            DynamicKey.hash.socketsUser(socketGame.handshake.query.userName),
            'game',
            socketGame.id,
        );
        socketGame.on('disconnect', () => {
            console.log('Desconectado del socket de juegos');
        });
    });

    // gameGroups.on(EGameEvents.JOIN_GROUP, () => {});
    // Emitir siempre que el usuario gane sin importar el grupo
    gameGroups.emit('update-purchase-history-user');

    // emitir ganadores en el momento
    gameGroups.emit('top-winners-globals');

    // cuando un usuario se registra en un grupo emitir un evento al cliente
    //  con el recien ingresado

    // una solo pestana por user
    gameGroups.emit('');

    // marcar notifiaciones como leidas
    // notificacion
    // gameGroups.emit('confetti-celebration')
    // this.gameGroups.emit('winGame', () => {
    //     mainSocket.emit('notification', () => {
    //
    //     });
    // });
};

export const sendMessageToConnectedUser = async (userName: string, event: EMainEvents, payload: any) => {
    const socketID = await redisPub.hget(DynamicKey.hash.socketsUser(userName), 'main');
    if (!!socketID) {
        // @ts-ignore
        mainSocket.of('/').adapter.clients((err, clients) => {
            if (!!socketID && clients.includes(socketID)) {
                if (event === EMainEvents.CLOSE_SESSION) {
                    mainSocket.sockets.connected[socketID].disconnect(true);
                } else {
                    mainSocket.to(socketID).emit(event, payload);
                }
            }
        });
    }
};

export {mainSocket, gameGroups};
