import SocketIO from 'socket.io';

export interface IGroupGameNamespace {
    _id: string;
    path: string;
    io: SocketIO.Namespace;
}