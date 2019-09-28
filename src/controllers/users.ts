import Express, {NextFunction} from 'express';
import catchAsync from '../utils/catchAsync';
import {User} from '../db/models';
import {resultOrNotFound} from '../utils/defaultImports';
import {matchedData} from 'express-validator/filter';
import AppError from '../classes/AppError';
import {IUserDocument} from '../db/interfaces/IUser';
import {recoverAccountEmail} from '../services/email';
import {createOne} from './factory';

export const getUsers = catchAsync(async (req: Express.Request, res: Express.Response) => {

    const result = await User.find({}, 'firstName lastName userName email role birthDate gender isVerified enabled createdAt')
        .populate('role')
        .exec();
    res.status(200).json(result);
});

export const getUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userId = req.params.userId;

    const user = await User.findById(
        userId,
        'firstName lastName userName email role birthDate isVerified phones enabled createdAt updatedAt',
    )
        .populate('role')
        .exec();
    resultOrNotFound(res, user, 'User', next);
});

export const updateMe = (req: Express.Request, res: Express.Response, next: NextFunction) => {
    req.params.userId = req.user._id;
    next();
};

export const updateUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userData = matchedData(req, {
        locations: ['body', 'query', 'params'],
        onlyValidData: true,
        includeOptionals: false
    });
    console.log('updating user', userData);
    const userUpdated: IUserDocument | null = await User.findByIdAndUpdate(userData.userId, userData, {
        new: true,
        runValidators: true
    });
    if (userUpdated == null) {
        return next(new AppError('Usuario no encontrado', 404, 'UNFOUND'));
    }
    res.status(200).json({
        status: 200,
        message: 'Usuario actualizado',
        data: userUpdated
    });
});

export const changeStateUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const data = matchedData(req, {locations: ['query', 'params']});

    console.log('Change state user');
    console.log(data);
    const user = await User.findById(data.userId);
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

    const user = await User.findOne({userName: userName});
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

export const updatePaypalEmail = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userData = matchedData(req, {locations: ['body', 'params']});
    const user = await User.findById(userData.userId);

    if (user) {

        await user.updateOne({
            $set:
                {'paypalEmail': userData.paypalEmail}
        });

        res.status(200).json({
            message: 'Correo de paypal Actualizado',
        });
    } else {
        console.log('User not found!');
        next(new AppError('Usuario no encontrado!', 404, 'NEXIST'));
    }

});

export const createUser = createOne<IUserDocument>(User);