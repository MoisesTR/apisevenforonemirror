import Express from 'express';
import {NextFunction} from 'express';

export type ControllerType = (
    req: Express.Request,
    res: Express.Response,
    next: NextFunction,
) => Promise<any>;
