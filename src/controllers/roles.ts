import Express, {NextFunction} from 'express';
import {matchedData} from 'express-validator/filter';
import models from '../db/models';
import {resultOrNotFound} from '../utils/defaultImports';
import catchAsync from '../utils/catchAsync';

export const createRole = catchAsync(async (req: Express.Request, res: Express.Response, next: (err: any) => void) => {
    const roleData = matchedData(req, {locations: ['body']});

    const role = new models.Role({...roleData});
    const result = await role.save();

    res.status(201).json({message: 'Role added successful!'});
});

export const getRoles = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const roles = await models.Role.find();

    res.status(200).json(roles);
});

export const getRole = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const roleId = req.params.roleId;
    console.log(roleId);
    let role = models.Role.findById(roleId);
    resultOrNotFound(res, role, 'Role', next);
});
