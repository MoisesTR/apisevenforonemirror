const jwt = require('../services/jwt');
const bcrypt    = require('bcryptjs');
const randomstring = require('randomstring');
const User      = require('../models/User');
const Role      = require('../models/Role');
const {mssqlErrors, matchedData} = require('../Utils/defaultImports')
const saltRounds    = 10;

//funcion registro
exports.signUp = async ( req, res, next ) => {
    const   userData    = matchedData(req);
    try {
        const hashPassw = await bcrypt.hash(userData.password, saltRounds)
        
        const users = await User.find({userName: userData.userName, email: userData.email}).toArray()
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
exports.singIn = async ( req, res, next ) => {
    const   userData = matchedData(req);
    let     user =  null;
    
    try {
        const user = await User.findOne({ userName: userData.userName })
        if (user) {
            const isequal = await bcrypt.compare(userData.password, passh);

            if ( isequal ) {
                if ( !user.isVerified ) {
                    throw { status: 401, code: 'NVERIF', message: 'You need to verify your email address in order to login'}
                }
                if ( !userData.getUserInfo ) {
                    console.log('Sending the token')
                    let {_token : tokenGen, expiration} = await jwt.createToken(user);
                    res.status(200)
                        .json({ token: tokenGen, expiration });
                } else {
                    console.log('Sending the user info.');
                    res.status(200)
                        .json(user);
                }
            } else {
                throw { status: 401, code: 'EPASSW', message: 'Wrong Password.' };
            }
        } else {
            console.log('User not found!');
            throw { status: '401', code: 'NEXIST', message: 'User not found!' };
        }
    } catch( err ) {
        next( err );
    }
}

exports.getUsers = (req, res) => {
    const filters = matchedData(req, {locations: ['query']});
    
    User
    .find({},'firstName lastName userName email role birthDate isVerified enable createdAt')
    .populate('role')
    .exec()
    .then((result) => {
        res.status(200)
            .json(result);
    }).catch((error) => {
        res.status( error.status | 500)
            .json(error)
    })
}

exports.verifyEmail = ( req, res, next ) => {
    const data = matchedData(req, {locations: ['params', 'query']});

    User.findOne({ secretToken: data.token, userName: data.userName})
    .then(user => {
        if ( user ) {
            user.secretToken = null;
            user.isVerified = true;
            return user.save()
        } else {
            throw { status: 400, code: 'EVERIF', message: "The verify token is not valid." }
        }
    })
    .then((result) => {
        res.status(200)
            .json({success: "Welcome to Seven for One, your email is verified!"})  
    }).catch((err) => {
        next(err);
    });

}

exports.updateUser = (req, res) => {
    const userData = matchedData(req, { locations: ['body', 'query']});
    if ( userId != req.user._id ) {
        return res.status(403)
                .json({ 
                    status: 403, 
                    code: 'EUNAUTH', 
                    message: 'You cant not edit this user.' 
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

    User.findById( data.userId )
    .then( user => {
        user.enable  = data.state;
        let accion = state ? 'Enable' : 'Disable';
    })
    .then(result=> {
        console.log(result);
        res.status(200)
            .json((afectadas > 0) ? { success: 'Usuario ' + accion + ' con exito!' } : { failed: 'No se encontro el usuario solicitado!' })
        console.log('Usuario cambiado de estado con exito!')
    })
    .catch((err) => {
        res.status(500).json(err)
        console.log('Error:', err)
    });
}

exports.getAuthenticateUserInfo = ( req, res ) => {
    res.status(200)
        .json(req.user)
}

exports.refreshToken = ( req, res ) => {
    const data = matchedData(req, {locations: []})
}

exports.getRoles = (req, res, next) => {
    
};

exports.getRole = (req, res, next) => {
    
};

exports.getUser = (req, res, next) => {
    const userId = req.params.userId;

    User.findById( userId, 'firstName lastName userName email role birthDate isVerified secretToken phones enable createdAt updatedAt' )
    .populate('role')
    .exec()
    .then( user => {
        res.status(200)
            .json(user)
    })
    .catch(err => next(err))
}