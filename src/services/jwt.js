'use strict';
const jwt       = require('jsonwebtoken');
const moment    = require('moment');
const accessSecret = process.env.JWT_SECRET || "NIC@R46U@";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "R3@CT_Cl13nt_7X0ne";

module.exports = app => {
    let methods = {};
    const models = app.db.core.models;

    async function createToken(customPayload, secret, expiration, unitTime) {
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

    methods.createAccessToken = async (user, expiration = 10, unitOfTime = "minutes") => {
        return createToken({
            sub: user._id,
            email: user.email,
            username: user.userName,
        }, accessSecret, expiration, unitOfTime)
    };

    methods.createRefreshToken = async (user, expiration = 1, unitOfTime = "hours") => {
        return createToken({
            sub: user._id
        }, refreshSecret, expiration, unitOfTime)
    };

    async function verifyToken( token, secret ) {
        let _decoded;
        try {
            _decoded = await jwt.verify( token, secret );
            return _decoded;
        } catch( _err ) {
            if ( _err.name === 'TokenExpiredError') {
                _decoded     = jwt.decode(token, {complete: true});
                _decoded.payload.isExpired   = true;
                return _decoded.payload;
            } else {
                let error   = {..._err};
                error.code    = 'EITOKEN';
                throw {
                    ...error,
                    status: 401
                };
            }
        }
    }

    methods.containToken = ( req, res, next ) => {
        if ( !req.headers.authorization ) {
            return res.status(401)
                    .json({
                        status: 401,
                        code:   'NAUTH',
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
    methods.ensureAuth = async ( req, res, next ) => {
        const token   = req.headers.authorization.replace(/['"]+/g,'').replace('Bearer ', '');

        try {
            const decode = await verifyToken( token, accessSecret );
            console.log(decode)
            const user =  await models.User.findById( decode.sub );
            //en caso de encontrarlo refrescaremos su informacion por si ha habido un cambio
            if ( !!user ) {
                //Si encontramos el usuario
                console.log('The user was found');
                if ( user.enabled === false ) {
                    //si el usuario se encuentra deshabilitado
                    throw {
                            status:401, code:'EPUSER',
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
                req.user    = user;
                next(); //next para pasar al siguiente controlador
            } else {
                throw {
                        status: 404, code:'NFUSER',
                        message:'User not found, contact to the admin.'
                    };
            }
        }
        catch ( error ) {
            next( error );
        }
    };

    methods.midOwnUserOrAdmon = ( req, res, next )  => {
        const receivedId = req.params.id_user || req.body.id_user;
        /**
         * TODO: Obtener el rol de administrador al desplegar la aplicacion
         */
        console.log(global.roleAdmon, req.user.id_role)
        if ( (req.user.id_user !== +receivedId) || (req.user.id_role !== global.roleAdmon) )
            return next({
                status: 403,
                code: 'NOTPER',
                message: 'You dont have permission!'
            });
        next();
    };

    return methods;
};