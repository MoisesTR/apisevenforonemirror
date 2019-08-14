import Express from 'express';
import {validationResult} from 'express-validator/check';
import {ObjectId} from 'mongodb';

export const isValidDate = (value: string, fieldName: any) => {
    let date = new Date(value);

    // @ts-ignore
    if (isNaN(date)) {
        throw new Error(`El campo ${fieldName.path} debe ser una fecha válida!.`);
    }
    return date.toISOString();
};

export const isObjectId = (value: any) => {
    return new ObjectId(value);
};

export const validsParams = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(errors.array());
    next();
};
