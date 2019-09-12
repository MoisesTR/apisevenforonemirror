import Express, {NextFunction} from 'express';
import catchAsync from '../utils/catchAsync';
import models from '../db/models';
import {resultOrNotFound} from '../utils/defaultImports';
import {matchedData} from 'express-validator/filter';
import AppError from '../classes/AppError';
import {IUserDocument} from '../db/interfaces/IUser';
import {recoverAccountEmail} from '../services/email';

export const getUsers = catchAsync(async (req: Express.Request, res: Express.Response) => {
    // const filters = matchedData(req, {locations: ['query']});

    const result = await models.User.find({}, 'firstName lastName userName email role birthDate gender isVerified enabled createdAt')
        .populate('role')
        .exec();
    res.status(200).json(result);
});

export const getUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userId = req.params.userId;

    const user = await models.User.findById(
        userId,
        'firstName lastName userName email role birthDate isVerified phones enabled createdAt updatedAt',
    )
        .populate('role')
        .exec();
    resultOrNotFound(res, user, 'User', next);
});

export const updateUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userData = matchedData(req, {locations: ['body', 'query', 'params']});

    if (userData.userId === JSON.stringify(req.user._id)) {
        return next(new AppError('No puedes editar este usuario', 403, 'EUNAUTH'));
    }
    const user: IUserDocument | null = await models.User.findById(userData.userId);
    if (user == null) {
        return next(new AppError('Usuario no encontrado', 404, 'UNFOUND'));
    }
    const userUpdate: IUserDocument = await user.updateUser(userData);
    res.status(200).json({
        status: 200,
        message: 'Usuario actualizado',
    });
});

export const changeStateUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const data = matchedData(req, {locations: ['query', 'params']});

    console.log('Change state user');
    console.log(data);
    const user = await models.User.findById(data.userId);
    if (!user) {
        res.status(400).json({failed: 'Usuario no encontrado!'});
        return;
    }
    const action = data.enabled ? 'Habilitado' : 'Deshabilitado';
    user.secretToken = '';
    user.enabled = data.enabled;
    await user.save();
    res.status(200).json({success: 'El usuario ha sido' + action});
});

export const getEmailByUserName = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    // TODO: return
    const userName = req.params.userName;

    const user = await models.User.findOne({userName: userName});
    if (!user) {
        return next(new AppError('User not found!', 404, 'UNFOUND'));
    } else if (!user.enabled) {
        return next(new AppError('Usuario deshabilitado, contacte con el soporte de 7x1!.', 403, 'EPUSER'));
    }

    // TODO: update that config
    try {
        await recoverAccountEmail(user, '');

        console.log('Email envado');
        res.status(200).json({userName: userName, email: user.email});

    } catch (_err) {
        throw _err;
    }
});
