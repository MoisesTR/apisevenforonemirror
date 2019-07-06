const socketKey = (username: string) => `socket-${username}`;
const refreshKey = (username: string) => `refresh-${username}`;
const tokenKey = (username: string) => `token-${username}`;
const socketsUser = (username: string) => `sockets-${username}`;

export default class DynamicKey {
    private static _instance: DynamicKey;
    private constructor( ) {

    }
    // public static get instance() {
    //     if ( !this._instance)
    //         this._instance = new DynamicKey();
    //     return this._instance;
    // }

    public static get set() {
        return {
            socketKey,
            refreshKey,
            tokenKey
        }
    }

    public static get hash() {
        return {
            socketsUser,
        }
    }
}