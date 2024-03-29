'use strict';
import Express, {NextFunction, RequestHandler} from 'express';
import envVars from '../global/environment';
import jwt from 'jsonwebtoken';
import moment, {DurationInputArg1, DurationInputArg2} from 'moment';
import {IUserDocument} from '../db/interfaces/IUser';
import AppError from '../classes/AppError';
import logger from './logger';
import {ECookies} from '../controllers/interfaces/ECookies';
import catchAsync from '../utils/catchAsync';
import {User} from '../db/models';
import {ObjectId} from 'bson';

const createToken = async (customPayload: any, secret: string, expiration: DurationInputArg1, unitTime: DurationInputArg2) => {
    let _token;
    const payload = {
        ...customPayload,
        // iar:    moment().unix(), /* Fecha de creacion */
        exp: moment()
            .add(expiration, unitTime)
            .unix() /* Token expira en una hora */,
    };
    //jsonwebtoken agrega el campo iat por defecto
    //Generated jwts will include an iat (issued at) claim by default unless noTimestamp is specified.
    //If iat is inserted in the payload, it will be used instead of the real timestamp for calculating other things like exp given a timespan in options.expiresIn.
    //En este caso la fecha de expiracion la calculamos con moment
    //HMAC SHA256
    _token = await jwt.sign(payload, secret);
    return {_token, expiration: payload.exp};
};

export const createAccessToken = async (user: IUserDocument, expiration: number = envVars.ACCESS_TOKEN_DURATION, unitOfTime: DurationInputArg2 = envVars.ACCESS_TOKEN_MEASURE) => {
    return createToken(
        {
            sub: user._id,
            email: user.email,
            username: user.userName,
        },
        envVars.JWT_SECRET,
        expiration,
        unitOfTime,
    );
};

export const createRefreshToken = async (user: IUserDocument, expiration: number = envVars.REFRESH_TOKEN_DURATION, unitOfTime: DurationInputArg2 = envVars.REFRESH_TOKEN_MEASURE) => {
    return createToken(
        {
            sub: user._id,
        },
        envVars.JWT_SECRET,
        expiration,
        unitOfTime,
    );
};

async function verifyToken(token: string, secret: string) {
    let _decoded;
    try {
        _decoded = await jwt.verify(token, secret);
        return _decoded;
    } catch (_err) {
        if (_err.name === 'TokenExpiredError') {
            _decoded = jwt.decode(token, {complete: true});
            if (!_decoded && typeof _decoded !== 'string') {
                throw new AppError('Decoded Cannot be null!', 400);
            }
            // @ts-ignore
            _decoded.payload.isExpired = true;
            // @ts-ignore
            return _decoded.payload;
        } else {
            let error = {..._err};
            error.code = 'EITOKEN';
            throw {
                ...error,
                status: 401,
            };
        }
    }
}

export const containToken = (req: Express.Request, res: Express.Response, next: NextFunction) => {
    if (!req.headers.authorization) {
        return next(new AppError('The request hasn\'t got authentication header', 401, 'NAUTH'));
    }
    next();
};

/**
 * @name ensureAuth
 * @description Utilizar siempre precedida de containToken
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {Middleware} next
 */
export const ensureAuth = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization) {
        token = req.headers.authorization.replace(/['"]+/g, '').replace('Bearer ', '');
    } else if (req.cookies[ECookies._AccessToken]) {
        token = req.cookies[ECookies._AccessToken];
    }

    if (!token) {
        return next(new AppError('The request hasn\'t got authentication token.', 400, 'NAUTH'));
    }

    logger.info('Verificando token: ' + token, {location: 'jwt'});
    const decode = await verifyToken(token, envVars.JWT_SECRET);
    const user = await User.findById(decode.sub);
    //en caso de encontrarlo refrescaremos su informacion por si ha habido un cambio
    if (!user) {
        return next(new AppError('Usuario no encontrado', 404, 'UNFOUND'));
    } else {
        //Si encontramos el usuario
        if (user.enabled === false) {
            //si el usuario se encuentra deshabilitado
            return next(new AppError('Usuario deshabilitado, contacte con el soporte de 7x1!.', 400, 'EPUSER'));
        }
        if (decode.isExpired) {
            if (req.cookies[ECookies._RefreshToken]) {
                try {
                    const refreshToken = req.cookies[ECookies._RefreshToken];
                    const decodedRefresh = await verifyToken(refreshToken, envVars.JWT_SECRET);
                    //TODO: figure out status code
                    if (decodedRefresh.sub !== decode.sub) {
                        return next(new AppError('No coinciden los usuario de los tokens', 405));
                    }
                    if (decodedRefresh.isExpired) {
                        return next(new AppError('Refresh token expired, please log again!', 401, 'TOKENEXPIRED'));
                    }
                    const {_token: tokenGen, expiration} = await createAccessToken(user);
                    res.cookie(ECookies._AccessToken, tokenGen, {
                        expires: moment.unix(decodedRefresh.exp).toDate(),
                        httpOnly: true,
                        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
                    });
                    console.log('new token was created', decodedRefresh);
                    req.user = user;
                    return next();

                } catch (_e) {
                    res.clearCookie(ECookies._AccessToken);
                    throw _e;
                }
            }
            return next(new AppError('Access token expired, refresh please!', 401, 'TOKENEXPIRED'));
        }

        req.user = user;
        return next(); //next para pasar al siguiente controlador
    }
});

export const midOwnUserOrAdmon = (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const receivedId = req.params.id_user || req.body.id_user;
    // @ts-ignore
    if (req.user._id !== +receivedId || req.user.role !== global.roleAdmon) {
        return next({
            status: 403,
            code: 'NOTPER',
            message: 'No tienes permisos!',
        });
    }
    next();
};
export const isAdmin: RequestHandler = (req, res, next) => {
    return isInRole(req.app.locals.roleAdmin._id)(req, res, next);
};
export const isInRole = (...roles: ObjectId[]) => (req: Express.Request, res: Express.Response, next: NextFunction) => {
    console.log('isInRole', req.user.role, roles);
    if (!!roles.find(r => r.equals(req.user.role))) {
        return next();
    }
    next(new AppError('You dont have permission to perform that action!', 403));
};
