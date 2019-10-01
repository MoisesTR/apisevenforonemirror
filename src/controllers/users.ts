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
import {recoverAccountEmail} from '../services/email';
import {createOne} from './factory';
import {upload} from '../routes/image-loader';
import {promisify} from 'util';

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
export const uploadUserImage = upload.single('photo');

export const resizeUserImages = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    // 1) Rename the new image
    req.file.filename = `${req.user.userName}-${Date.now()}.jpeg`;

    // 2) Resizing the new image
    // 2.a Principal size
    await sharp(req.file.buffer)
        .resize(envVars.PRINCIPAL_PIC_DIMENSION, envVars.PRINCIPAL_PIC_DIMENSION)
        .toFormat('jpeg')
        .jpeg({
            quality: 95,
        })
        .toFile(`src/uploads/user/${req.file.filename}`);

    // 2.b Thumbnail Size
    await sharp(req.file.buffer)
        .resize(envVars.THUMBNAIL_PIC_DIMENSION, envVars.THUMBNAIL_PIC_DIMENSION)
        .toFormat('jpeg')
        .jpeg({
            quality: 90,
        })
        .toFile(`src/uploads/user/thumb-${req.file.filename}`);
    next();
});

export const updateUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userData = matchedData(req, {
        locations: ['body', 'query', 'params'],
        onlyValidData: true,
        includeOptionals: false,
    });
    console.log('user data', userData)
    // Detect is image is coming
    if (req.file) {
        const oldPrimaryPath = path.resolve(__dirname, `../uploads/user/${req.user.image}`);
        // 1) Get rid off of the old image
        userData.isExternalImage = false;
        // @ts-ignore
        userData.image = req.file.filename;
        // @ts-ignore
        userData.thumbnail = `thumb-${req.file.filename}`;
        if (req.user.image) {
            try {
                await promisify(fs.access)(oldPrimaryPath, fs.constants.F_OK);

                await promisify(fs.unlink)(oldPrimaryPath);

                if (req.user.thumbnail) {
                    const oldThumbnail = path.resolve(__dirname, `../uploads/user/${req.user.thumbnail}`);
                    await promisify(fs.access)(oldThumbnail, fs.constants.F_OK);

                    await promisify(fs.unlink)(oldThumbnail);
                }
            } catch (_err) {
                // return next(new AppError('Ha ocurrido un error al eliminar la imagen anterior!', 400, 'ERRIMGDEL'));
                console.log(new AppError('Ha ocurrido un error al eliminar la imagen anterior!', 400, 'ERRIMGDEL'));
            }
        }
    }

    const userUpdated: IUserDocument | null = await User.findByIdAndUpdate(userData.userId, userData, {
        new: true,
        runValidators: true,
    });
    if (userUpdated == null) {
        return next(new AppError('Usuario no encontrado', 404, 'UNFOUND'));
    }
    res.status(200).json({
        status: 200,
        message: 'Usuario actualizado',
        data: userUpdated,
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
            $set: {paypalEmail: userData.paypalEmail},
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
