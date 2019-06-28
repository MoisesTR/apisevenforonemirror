import {IUserDocument} from '../db/interfaces/User';

declare global {
    namespace Express {
        interface Request {
            user: IUserDocument
        }
    }
}
declare namespace Express {
    interface Request {
        user: IUserDocument;
    }
}
declare namespace NodeJS {
    interface Error {
        status: number;
    }
}
declare global {

interface Error {
    status?: number
}
}
