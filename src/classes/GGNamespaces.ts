import {GroupGameNamespace} from './GroupGameNamespace';

export class GGNamespaces {
    groups: GroupGameNamespace[];

    constructor() {
        this.groups = [];
    }

    public addGroup( newGroup: GroupGameNamespace ) {
        this.groups.push(newGroup);
    }

    public removeGroup( _id: string) {
        const indx = this.groups.findIndex(group => group._id === _id);
        this.groups[indx].io.removeAllListeners();
        // this.groups[indx].io.adapter.c
    }

    public getLastGroup( ) {

    }
}