import {IUserDocument} from "../db/interfaces/User";

declare global {
    export namespace Express {
        export interface Request {
            user: IUserDocument
        }
    }
}
