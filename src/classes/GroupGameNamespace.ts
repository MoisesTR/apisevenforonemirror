import SocketIO from 'socket.io';
import {IGroupGameDocument} from '../db/interfaces/IGroupGame';
import {IGroupGameNamespace} from './interfaces/GroupGameNamespace';

export class GroupGameNamespace implements IGroupGameNamespace {
    _id: string;
    path: string;
    io: SocketIO.Namespace;

    constructor({_id}: IGroupGameDocument, ioServer: SocketIO.Server) {
        this._id = _id;
        this.path = 'path';
        this.io = ioServer.of(_id);
    }
}
