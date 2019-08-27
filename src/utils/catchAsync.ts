import Express from 'express';
import {NextFunction} from 'express';
import {ControllerType} from '../controllers/interfaces/ControllerType';

export default (fn: ControllerType) => (req: Express.Request, res: Express.Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
};
