import {IUserDocument} from '../db/interfaces/IUser';

declare global {
    namespace Express {
        interface Request {
            user: IUserDocument;
        }
    }
}
declare namespace Express {
    interface Request {
        user: IUserDocument;
    }
}

declare global {
    interface Error {
        status?: number;
        code?: string | number | undefined;
    }
}
