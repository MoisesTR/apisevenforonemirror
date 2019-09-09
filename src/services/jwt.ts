'use strict';
import Express, {NextFunction} from 'express';
import envVars from '../global/environment';
import jwt from 'jsonwebtoken';
import moment, {DurationInputArg1, DurationInputArg2} from 'moment';
import {IUserDocument} from '../db/interfaces/IUser';
import AppError from '../classes/AppError';
import models from '../db/models';
import logger from './logger';
import {ECookies} from '../controllers/interfaces/ECookies';

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
}

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
export const ensureAuth = async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    let token;
    if ( req.headers.authorization ) {
        token =  req.headers.authorization.replace(/['"]+/g, '').replace('Bearer ', '');
    } else if (req.cookies[ECookies._AccessToken]) {
        token = req.cookies[ECookies._AccessToken];
    }

    if (!token) {
        return next(new AppError('The request hasn\'t got authentication token.', 400, 'NAUTH'));
    }

    logger.info('Verificando token: ' + token, {location: 'jwt'});
    const decode = await verifyToken(token, envVars.JWT_SECRET);
    const user = await models.User.findById(decode.sub);
    //en caso de encontrarlo refrescaremos su informacion por si ha habido un cambio
    if (!!user) {
        //Si encontramos el usuario
        if (user.enabled === false) {
            //si el usuario se encuentra deshabilitado
            return next(new AppError('Usuario deshabilitado, contacte con el soporte de 7x1!.', 400, 'EPUSER'));
        }
        if (decode.isExpired) {
            return next(new AppError('Access token expired, refresh please!', 401, 'TOKENEXPIRED'));
        }
        //Si el usuario esta habilitado se procede a actualizar el username y el email
        //por si ha habido un cambio en estos
        //Verificamos que no ah habido cambio en la informacion del usuario, desde la creacion del token
        // if( moment(user.UpdatedAt).unix() > decoded.iat ){
        //     // si su info cambio no lo dejamos procedere
        //     throw {
        //             status: 401, code:'EUCHAN',
        //             message: 'La informacion del usuario cambio por favor vuelve a iniciar sesion!'
        //         };
        // }
        // //setear el valor del payload en la request, para poder acceder a esta informacion
        //en todas la funciones de nuestros controladores
        req.user = user;
        next(); //next para pasar al siguiente controlador
    } else {
        return next(new AppError('Usuario no encontrado', 404, 'UNFOUND'));
    }
};

export const midOwnUserOrAdmon = (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const receivedId = req.params.id_user || req.body.id_user;
    /**
     * TODO: Obtener el rol de administrador al desplegar la aplicacion
     */
    // console.log(global.roleAdmon, req.user.id_role);
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