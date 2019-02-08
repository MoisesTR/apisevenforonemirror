const jwt = require('../services/jwt');
const bcrypt    = require('bcryptjs');
const randomstring = require('randomstring');
const User      = require('../models/User');
const {mssqlErrors, matchedData} = require('../Utils/defaultImports')
const saltRounds    = 10;

//funcion registro
exports.signUp = async ( req, res, next ) => {
    const   userData    = matchedData(req);
    try {
        const hashPassw = await bcrypt.hash(userData.password, saltRounds)
        
        const users = User.find({userName: userData.userName, email: userData.email})
        //Si se encontro mas de un usuario
        if ( users.length > 1 ) {
            // console.log(usersfind.recordset[0])
            throw { status: 401, code: "UEEXIST", message: "No se registro el usuario, email y username ya se encuentran registrados!" };
            //res.status(401).json({code:"UEXIST",message:"No se registro el usuario, email o username ya registrados!"})
        } else if ( users.length === 1 ) {
            // if(usersfind[0].username == userData.username || usersfind[1].username== userData.username)
            if ( users[0].Username === userData.Username )
                throw { status: 401, code: "UEXIST", message: 'El usuario:' + userData.Username + ', ya se encuentra registrado!' };
            else
                throw { status: 401, code: "EEXIST", message: 'No se registro el usuario con email:' + userData.Email + ', ya se encuentra registrado!' };
        } else {
            const token = randomstring.generate(20);
            const user = new User({
                firstName: userData.firstName,
                lastName: userData.lastName,
                userName: userData.userName,
                email: userData.email,
                passwordHash: hashPassw,
                phones: userData.phones,
                role: userData.role,
                birthDate: userData.birthDate,
                isVerified: false,
                secretToken:  token,
                enable: false
            });
            const insertInfo =  await user.save();
            console.log(insertInfo);
            res.status(200)
                .json({ 
                    user: insertInfo
                })
        }
        // next();
    } catch ( _err ) {
        // res.status( _err.status || 500)
        //     .json( _err )
        next(_err)
    }
}

/**
 * @name singIn
 * @param {*} req 
 * @param {*} res 
 */
exports.singIn = ( req, res ) => {
    const   userData = matchedData(req);
    let     user =  null;

    User.getUserByUsername( userData.Username )
    .then( userResult => {
        user = userResult.recordset[0];
        if (user) {
            const passh = user.Password;

            return  bcrypt.compare(userData.Password, passh);
        } else {
            console.log('Usuario no encontrado!');
            throw { status: '401', code: 'NEXIST', message: 'El usuario ingresado no existe en la base de dato!' };
        }
    })
    .then((isequal) => {
        if (isequal) {
            console.log((!!userData.gettoken) ? 'Se retornara un token' : 'Se retornara la informacion del usuario');
            if (!!userData.gettoken) {
                console.log('Mande get token')
                let {_token : tokenGen, expiration} = jwt.createToken(user);
                //console.log('Devolviendo token, del usuario '+user.username);
                console.log('token:' + tokenGen);
                res.status(200)
                    .json({ token: tokenGen, expiration });
            } else {
                //delete user.password
                res.status(200)
                    .json(user);
            }
        } else {
            console.log('Las contrasenas no coinciden');
            throw { status: 401, code: 'EPASSW', message: 'La contraseña es incorrecta' };
        }
    })
    .catch((err) => {
        console.log('Error principal: ' + err);
        res.status( res.status || 500)
            .json(err)
    })
}

exports.getUsers = (req, res) => {
    const Habilitado = req.query.Habilitado;
    
    User.getUsers( {Habilitado} )
    .then((result) => {
        res.status(200)
            .json({
                 usuarios: result.recordset 
            });
    }).catch((error) => {
        res.status( error.status | 500)
            .json(error)
    })
}
//
exports.updateUser = (req, res) => {
    const userData = matchedData(req, { locations: ['body', 'query']});
    if (IdUsuario != req.user.sub) {
        return res.status(403)
                .json({ 
                    status: 403, 
                    code: 'EUNAUTH', 
                    message: 'Este no es tu usuario' 
                });
    }
    User.updateUser( userData )
    .then( result => {

        res.status(200)
            .json({ 
                status: 200, 
                message: 'Usuario actualizado' 
            });
    })
    .catch( err => {
        res.status(err.status || 500)
            .json(mssqlErrors(err))
    })
}

exports.changeStateUser = ( req, res ) => {
    const data = matchedData(req, {locations: ['body', 'params']});

    User.changeStateUser( data.IdUsuario, data.Habilitado )
    .then((results) => {
        console.log(results)
        let afectadas = results.rowsAffected[0]
        let accion = (Habilitado == 0) ? 'Deshabilitado' : 'Habilitado';
        res.status(200)
            .json((afectadas > 0) ? { success: 'Usuario ' + accion + ' con exito!' } : { failed: 'No se encontro el usuario solicitado!' })
        console.log('Usuario cambiado de estado con exito!')
    }).catch((err) => {
        res.status(500).json(err)
        console.log('Error:', err)
    });
}

exports.getAuthenticateUserInfo = ( req, res ) => {
    
    res.status(200)
        .json(req.user)
}

exports.refreshToken = ( req, res ) => {
    
}