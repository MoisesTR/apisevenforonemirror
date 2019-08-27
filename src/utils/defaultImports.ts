import Express, {NextFunction} from 'express';
import moment from 'moment';
import AppError from '../classes/AppError';
export {matchedData, sanitize} from 'express-validator/filter';
export {query, param, body, check, oneOf, validationResult} from 'express-validator/check';

export const resultOrNotFound = (resp: Express.Response, result: any, name: string, next: NextFunction) => {
    if (!result) {
        return next(new AppError(`${name} not found!`, 404, 'NEXIST'));
    }
    resp.status(200).json(result);
};

export function remainigTimeInSeconds(millisTime: number) {
    return moment.unix(millisTime).diff(moment(), 'seconds');
}
