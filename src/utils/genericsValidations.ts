import Express from 'express';
import { validationResult } from 'express-validator/check';
import {ObjectId} from 'mongodb';


export const isValidDate = (value: string, fieldName: any) => {
    let date= new Date(value);

    // @ts-ignore
    if(isNaN(date)) {
        throw new Error(`The field ${fieldName.path} must be a valid Date.`);
    }
    return date.toISOString();
};

export const isObjectId = (value: any) => {
    console.log(ObjectId.isValid(value));
    return new ObjectId(value);
};

export const validsParams = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const errors = validationResult(req);
    if ( !errors.isEmpty() )
        return res.status(400).json(errors.array());
    next();
};
