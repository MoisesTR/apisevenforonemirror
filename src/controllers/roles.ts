import Express, {NextFunction} from 'express';
import {matchedData} from 'express-validator/filter';
import {IModels} from "../db/core";
import Server from "../server";
import {resultOrNotFound} from "../utils/defaultImports";

export default class RoleController {
    private models: IModels;

    constructor(server: Server) {
        this.models = server.dbCore.models;
    }

    createRole = (req: Express.Request, res: Express.Response, next: (err: any) => void) => {
        const roleData = matchedData(req, {locations: ['body']});

        const role = new this.models.Role({...roleData});
        role
            .save()
            .then(() => res.status(201).json({message: 'Role added successful!'}))
            .catch(next)
    };

    getRoles = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        this.models.Role
            .find()
            .then(roles => {
                res.status(200)
                    .json(roles)
            })
            .catch(err => next(err))
    };

    getRole = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const roleId = req.params.roleId;
        console.log(roleId);
        this.models.Role
            .findById(roleId)
            .then(role => {
                resultOrNotFound(res, role, 'Role');
            })
            .catch(err => next(err))
    };

}

