import Express, {NextFunction} from 'express';
import {matchedData} from 'express-validator/filter';
import {Role} from '../db/models';
import {resultOrNotFound} from '../utils/defaultImports';
import catchAsync from '../utils/catchAsync';
import {getAll} from './factory';

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

export const getRole = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const roleId = req.params.roleId;
    let role = await Role.findById(roleId);
    resultOrNotFound(res, role, 'Role', next);
});
