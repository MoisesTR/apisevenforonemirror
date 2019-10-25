import Express from 'express';
import {NextFunction} from 'express';
import {IUserDocument} from '../../db/interfaces/IUser';
import {DurationInputArg2} from 'moment';

export interface IJWTResponse {
    ensureAuth: (req: Express.Request, res: Express.Response, next: NextFunction) => Promise<void>;
    createAccessToken: (
        user: IUserDocument,
        expiration?: number,
        unitOfTime?: any,
    ) => Promise<{_token: string; expiration: number}>;
    createRefreshToken: (
        user: IUserDocument,
        expiration?: number,
        unitOfTime?: DurationInputArg2,
    ) => Promise<{_token: string; expiration: number}>;
}
