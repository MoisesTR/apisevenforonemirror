import Express, {NextFunction} from 'express';
import {matchedData} from 'express-validator/filter';
import {IModels} from '../db/core';
import Server from '../server';
import {resultOrNotFound} from '../utils/defaultImports';
import catchAsync from '../utils/catchAsync';

export default class RoleController {
    private models: IModels;
    createRole = catchAsync(async (req: Express.Request, res: Express.Response, next: (err: any) => void) => {
        const roleData = matchedData(req, {locations: ['body']});

        const role = new this.models.Role({...roleData});
        const result = await role.save();

        res.status(201).json({message: 'Role added successful!'});
    });
    getRoles = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const roles = await this.models.Role.find();

        res.status(200).json(roles);
    });
    getRole = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const roleId = req.params.roleId;
        console.log(roleId);
        let role = this.models.Role.findById(roleId);
        resultOrNotFound(res, role, 'Role', next);
    });

    constructor(server: Server) {
        this.models = server.dbCore.models;
    }
}
