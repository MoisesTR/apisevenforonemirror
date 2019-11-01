import Express, {NextFunction} from 'express';
import sharp = require('sharp');
import fs = require('fs');
import path = require('path');
import envVars from '../global/environment';
import catchAsync from '../utils/catchAsync';
import {User} from '../db/models';
import {resultOrNotFound} from '../utils/defaultImports';
import {matchedData} from 'express-validator/filter';
import AppError from '../classes/AppError';
import {IUserDocument} from '../db/interfaces/IUser';
import {createOne, getAll, getOne} from './factory';
import {upload} from '../routes/image-loader';
import {promisify} from 'util';
import {ESRCH} from 'constants';

export const webhook = catchAsync(
    async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
        console.log(req.body);

        res.status(200).json({message: 'Todo Marcha Bien'});
    },
);
