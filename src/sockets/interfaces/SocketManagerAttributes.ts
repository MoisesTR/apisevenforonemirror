import socketIO from 'socket.io';

export interface ISocketManagerAttributes {
    main: socketIO.Server;
    gameGroups?: socketIO.Namespace;
}
