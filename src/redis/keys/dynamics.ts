const refreshKey = (username: string) => `refresh-${username}`;
const accessTokenKey = (username: string) => `acc_token-${username}`;
const socketsUser = (username: string) => `sockets-${username}`;

export default class DynamicKey {
    private static _instance: DynamicKey;
    private constructor() {}
    // public static get instance() {
    //     if ( !this._instance)
    //         this._instance = new DynamicKey();
    //     return this._instance;
    // }

    public static get set() {
        return {
            refreshKey,
            accessTokenKey,
        };
    }

    public static get hash() {
        return {
            socketsUser,
        };
    }
}
