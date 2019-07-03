import Express from 'express';
export {matchedData, sanitize} from 'express-validator/filter';
export {query, param, body, check, oneOf, validationResult} from 'express-validator/check';

export const resultOrNotFound = (resp: Express.Response, result: any, name: string) => {
    const cnf = {status: !result ? 404 : 200, message: `${name} not found!`};
    resp.status(cnf.status)
        .json(!result ? cnf : result)
};