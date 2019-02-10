'use strict'
const jwt       = require('jsonwebtoken');
const moment    = require('moment');
const secret    = "R3st@urAn3_C4aN";
const User = require('../models/User');

/**
 * @name createToken
 * @description Esta funcion recibe un usuario, para la creacion de un token personalizado
 * @param {Object} user
 */
exports.createToken = async ( user )  => {
    let     _token  ='';
    const   payload = {
        sub:        user._id,
        userName:   user.userName,
        email:      user.email,
        iar:    moment().unix(), /* Fecha de creacion */
        exp:    moment().add(1,"hours").unix() /* Token expira en un dia */
    };
    //jsonwebtoken agrega el campo iat por defecto
    //Generated jwts will include an iat (issued at) claim by default unless noTimestamp is specified. 
    //If iat is inserted in the payload, it will be used instead of the real timestamp for calculating other things like exp given a timespan in options.expiresIn.
    //En este caso la fecha de expiracion la calculamos con moment
    console.log('Creando payload')
    _token  = await jwt.sign(payload, secret);
    return { _token, expiration: payload.exp}
}

async function verifyToken( token ) {
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

exports.containToken = ( req, res, next ) => {
    if ( !req.headers.authorization ) {
        return res.status(401)
                .json({
                    status: 401,
                    code:   'NAUTH',
                    message:'La peticion no tiene cabecera de autenticaciòn'
                });
    }
    next();
}

/**
 * @name ensureAuth
 * @description Utilizar siempre precedida de containToken
 * @param {HttpRequest} req 
 * @param {HttpResponse} res 
 * @param {Middleware} next 
 */
exports.ensureAuth = ( req, res, next ) => {
    const token   = req.headers.authorization.replace(/['"]+/g,'').replace('Bearer ', '');
    let     decoded;
    // console.log(req.headers.authorization);
    const addOtherUInfo   =   'true' === req.query.addOtherUInfo;

    verifyToken( token )
    .then( _decoded => {
        console.log(_decoded);
        
        decoded = _decoded;
        //A continuacion procedemos a buscar el usuario para validar que se encuentre habilitado
        return User.findById( _decoded.sub )
    })
    .then( user => {
        //en caso de encontrarlo refrescaremos su informacion por si ha habido un cambio
        console.log('Busqueda de usuarios realizada', user);
        if ( !!user ) {
            //Si encontramos el usuario
            console.log('Se encontro el usuario');
            if ( user.enabled === false ) {
                //si el usuario se encuentra deshabilitado
                throw {status:401, code:'EPUSER', message:'Usuario deshabilitado,favor contactar con soporte AtomicDev.'};
            } 
            //Si el usuario esta habilitado se procede a actualizar el username y el email
            //por si ha habido un cambio en estos
            //Verificamos que no ah habido cambio en la informacion del usuario, desde la creacion del token
            if( moment(user.UpdatedAt).unix() > decoded.iat ){
                // si su info cambio no lo dejamos procedere
                throw {
                        status: 401, code:'EUCHAN',
                        message: 'La informacion del usuario cambio por favor vuelve a iniciar sesion!'
                    };
            }
            //setear el valor del payload en la request, para poder acceder a esta informacion
            //en todas la funciones de nuestros controladores
            req.user    = {...decoded};
            delete user.Password;
            if ( addOtherUInfo ) {
                req.user    = {...req.user, ...user };
            }
            next(); //next para pasar al siguiente controlador
        } else {
            throw {
                    status: 404, code:'EPUSER',
                    message:'Usuario no encontrado, favor contactar con soporte AtomicDev'
                };
        }
    })
    .catch( error => {
        console.log('Error del catch', error);
        
        res.status(error.status | 500)
            .json(error)
    })
}