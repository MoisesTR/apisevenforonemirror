'use strict';
import Express, {NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import moment, {DurationInputArg1, DurationInputArg2} from 'moment';
import Server from 'server';
import {IUser, IUserDocument} from "../db/interfaces/User";
import DurationConstructor = moment.unitOfTime.DurationConstructor;
import {type} from "os";
const server = Server.instance;

const accessSecret = process.env.JWT_SECRET || "NIC@R46U@";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "R3@CT_Cl13nt_7X0ne";

const models = server.dbCore.models;

async function createToken(customPayload: any, secret: string, expiration: DurationInputArg1, unitTime: DurationInputArg2) {
    let _token;
    const payload = {
        ...customPayload,
        // iar:    moment().unix(), /* Fecha de creacion */
        exp: moment().add(expiration, unitTime).unix() /* Token expira en una hora */
    };
    //jsonwebtoken agrega el campo iat por defecto
    //Generated jwts will include an iat (issued at) claim by default unless noTimestamp is specified.
    //If iat is inserted in the payload, it will be used instead of the real timestamp for calculating other things like exp given a timespan in options.expiresIn.
    //En este caso la fecha de expiracion la calculamos con moment
    //HMAC SHA256
    _token = await jwt.sign(payload, secret);
    return {_token, expiration: payload.exp}
}

export const createAccessToken = async (user: IUserDocument, expiration: number = 10, unitOfTime: DurationConstructor = "minutes") => {
    return createToken({
        sub: user._id,
        email: user.email,
        username: user.userName,
    }, accessSecret, expiration, unitOfTime)
};

export const createRefreshToken = async (user: IUserDocument, expiration: number = 1, unitOfTime: DurationInputArg2 = "hours") => {
    return createToken({
        sub: user._id
    }, refreshSecret, expiration, unitOfTime)
};

async function verifyToken(token: string, secret: string) {
    let _decoded;
    try {
        _decoded = await jwt.verify(token, secret);
        return _decoded;
    } catch (_err) {
        if (_err.name === 'TokenExpiredError') {
            _decoded = jwt.decode(token, {complete: true});
            if (  !_decoded && typeof  _decoded !== 'string')
                throw new Error('Decoded Cannot be null!');
            // @ts-ignore
            _decoded.payload.isExpired = true;
            // @ts-ignore
            return _decoded.payload;
        } else {
            let error = {..._err};
            error.code = 'EITOKEN';
            throw {
                ...error,
                status: 401
            };
        }
    }
}

export const containToken = (req: Express.Request, res: Express.Response, next: NextFunction) => {
    if (!req.headers.authorization) {
        return res.status(401)
            .json({
                status: 401,
                code: 'NAUTH',
                message: 'The request has no authentication header'
            });
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
    if (!req.headers.authorization) {
        return next({
            status: 401,
            code: 'NAUTH',
            message: 'The request has no authentication header'
        });
    }
    const token = req.headers.authorization.replace(/['"]+/g, '').replace('Bearer ', '');

    try {
        server.logger.info('Verificando token: ' + token, {location: 'jwt'});
        const decode = await verifyToken(token, accessSecret);
        console.log(decode);
        const user = await models.User.findById(decode.sub);
        //en caso de encontrarlo refrescaremos su informacion por si ha habido un cambio
        if (!!user) {
            //Si encontramos el usuario
            console.log('The user was found');
            if (user.enabled === false) {
                //si el usuario se encuentra deshabilitado
                throw {
                    status: 401, code: 'EPUSER',
                    message: 'User disabled, please contact support AtomicDev.'
                };
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
            throw {
                status: 404, code: 'NFUSER',
                message: 'User not found, contact to the admin.'
            };
        }
    } catch (error) {
        next(error);
    }
};

export const midOwnUserOrAdmon = (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const receivedId = req.params.id_user || req.body.id_user;
    /**
     * TODO: Obtener el rol de administrador al desplegar la aplicacion
     */
    // console.log(global.roleAdmon, req.user.id_role);
    // @ts-ignore
    if ((req.user._id !== +receivedId) || (req.user.role !== global.roleAdmon))
        return next({
            status: 403,
            code: 'NOTPER',
            message: 'You dont have permission!'
        });
    next();
};
