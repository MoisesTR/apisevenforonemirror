import Express from 'express';
import {matchedData} from 'express-validator/filter';
import {Role} from '../db/models';
import catchAsync from '../utils/catchAsync';
import {getAll, getOne} from './factory';
import {IRoleDocument} from '../db/interfaces/IRole';

export const createRole = catchAsync(async (req: Express.Request, res: Express.Response, next: (err: any) => void) => {
    const roleData = matchedData(req, {locations: ['body']});

    const role = new Role({...roleData});
    const result = await role.save();

    res.status(201).json({
        message: 'Role added successful!',
        document: result
    });
});

export const getRoles = getAll(Role);

export const getRole = getOne<IRoleDocument>(Role);
