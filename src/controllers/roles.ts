import Express from 'express';
import {matchedData} from 'express-validator/filter';
import {IRoleDocument} from '../db/interfaces/IRole';
import {Role} from '../db/models';
import catchAsync from '../utils/catchAsync';
import {getAll, getOne} from './factory';
import {EQueryCache} from './enums/EQueryCache';
import {clearQueryCache} from '../redis/redis';

export const createRole = catchAsync(async (req: Express.Request, res: Express.Response, next: (err: any) => void) => {
    const roleData = matchedData(req, {locations: ['body']});

    const role = new Role({...roleData});
    const result = await role.save();
    await clearQueryCache(EQueryCache.getRoles, '');
    res.status(201).json({
        message: 'Role added successful!',
        document: result,
    });
});

export const getRoles = getAll(Role, false, {key: EQueryCache.getRoles, extra: ''});

export const getRole = getOne<IRoleDocument>(Role);
