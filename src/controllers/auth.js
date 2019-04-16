const bcrypt    = require('bcryptjs');
const randomstring = require('randomstring');
const randomNumber = require('random-number');
// To send Mails
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { matchedData, resultOrNotFound} = require('../utils/defaultImports');
const saltRounds    = 10;
const {getHtml} = require('../utils/verifyEmailUtil');
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: "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"
    }
}));

// GOOGLE AUTHENTICATION
var CLIENT_ID = require('../config/config').CLIENT_ID;
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

//Logger
const logger = require('../utils/logger');

module.exports = app => {
    const URL_HOST  = process.env.URL_HOST ;
    const models = app.db.core.models;
    const jwt = app.services.jwt;
    let methods = {};

    //funcion registro
    methods.signInGoogle = async ( req, res, next ) => {
        const   userData    = matchedData(req);
        const tokenGoogle = userData.tokenGoogle;

        var googleUser = await verify(tokenGoogle)
        
        .catch( e => {
            res.status(403).json({
                ok : false
                , message: 'Token not valid!'
            });
        })

        try {

            const user = await models.User.findOne({email: googleUser.email});

            if (user) {
                if (!user.google) {
                    throw { status: 400, code: "AUTHNOR", message: "You must use your normal authentication!" };
                } else {
     
                    let {_token : tokenGen, expiration} = await jwt.createToken(user);
                    
                    if ( user.secretToken === "") {
                        const refreshToken = randomstring.generate(20);
                        user.secretToken = refreshToken;
                    }
                    
                    const saveResult = await user.save();
                    
                    res.status(200)
                    .json({
                        user: user
                        , token: tokenGen
                        , refreshToken: saveResult.secretToken
                        , expiration 
                    });
                    
                    saveLog(saveResult._id, {userName: saveResult.userName},`${saveResult.userName} joined us.`)
                } 

            } else {
                // El usuario no existe
                userData.password = randomstring.generate(4);
                const secretToken = randomstring.generate(20);
                const hashPassw = await bcrypt.hash(userData.password, saltRounds);
                const randomUserName = generateRandomUserName(googleUser.email);
                
                const user = new models.User({
                    firstName: googleUser.firstName,
                    lastName: googleUser.lastName,
                    userName: randomUserName,
                    image: googleUser.img,
                    google: googleUser.google,
                    email: googleUser.email,
                    passwordHash: hashPassw,
                    role: userData.role,
                    isVerified: true,
                    secretToken: secretToken,
                    enabled: true
                });

                const insertInfo =  await user.save();

                let {_token : tokenGen, expiration} = await jwt.createToken(user);
                
                saveLog( 
                    insertInfo._id
                    , { userName:insertInfo.userName
                        , firstName:insertInfo.firstName
                        , lastName:insertInfo.lastName
                        , email:insertInfo.email
                        , role:insertInfo.role }
                        ,'The user was successfully register!');
                res.status(200)
                .json({
                    user: user
                    , token: tokenGen
                    , refreshToken: user.secretToken
                    , expiration 
                });
            }

        } catch ( _err ) {
            next(_err)
        }
    };

    function generateRandomUserName(email) {
        var options = {
            min:  0
          , max:  999
          , integer: true
        }
        var number = randomNumber(options);
        var arrays = email.split('@') ;
        return arrays[0] + number;
    }

    async function verify(token) {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });

        const payload = ticket.getPayload();
        const userid = payload['sub'];
        // If request specified a G Suite domain:
        //const domain = payload['hd'];
        console.log(payload);
        return {
            name: payload.name
            , firstName: payload.given_name
            , lastName: payload.family_name
            , email: payload.email
            , img: payload.picture
            , google: true
        }
    }

    //funcion registro
    methods.signUp = async ( req, res, next ) => {
        const   userData    = matchedData(req);
        try {
            const hashPassw = await bcrypt.hash(userData.password, saltRounds);

            const users = await models.User.find({userName: userData.userName, email: userData.email});
            //Si se encontro mas de un usuario
            if ( users.length > 1 ) {
                // console.log(usersfind.recordset[0])
                throw { status: 401, code: "UEEXIST", message: "No se registro el usuario, email y username ya se encuentran registrados!" };
                //res.status(401).json({code:"UEXIST",message:"No se registro el usuario, email o username ya registrados!"})
            } else if ( users.length === 1 ) {
                // if(usersfind[0].username == userData.username || usersfind[1].username== userData.username)
                if ( users[0].Username === userData.Username )
                    throw { status: 401, code: "UEXIST", message: 'The userName:' + userData.userName + ' already exists!' };
                else
                    throw { status: 401, code: "EEXIST", message: 'No se registro el usuario con email:' + userData.Email + ', ya se encuentra registrado!' };
            } else {
                const token = randomstring.generate(20);
                const user = new models.User({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    userName: userData.userName,
                    email: userData.email,
                    passwordHash: hashPassw,
                    phones: userData.phones,
                    role: userData.role,
                    birthDate: userData.birthDate,
                    gender: userData.gender,
                    isVerified: false,
                    secretToken:  token,
                    enabled: false
                });
                const insertInfo =  await user.save();
                // console.log(insertInfo._id);
                saveLog( insertInfo._id, {userName:insertInfo.userName, firstName:insertInfo.firstName, lastName:insertInfo.lastName, email:insertInfo.email, role:insertInfo.role},'The user was successfully register!');
                res.status(201)
                    .json({
                        success: 'You have successfully registered, proceed to verify your email!'
                    });
                transporter.sendMail({
                    to: userData.email,
                    from: 'no-reply@sevenforone.com',
                    subject:"Welcome to Seven for One! Confirm Your Email",
                    html: getHtml( insertInfo.userName, URL_HOST  + '/confirm/' + insertInfo.secretToken)
                })
                .then((result) => {
                    console.log('Email enviado', result);

                }).catch((err) => {
                    console.log('Error enviando', err);

                });
            }
            // next();
        } catch ( _err ) {
            // res.status( _err.status || 500)
            //     .json( _err )
            next(_err)
        }
    };

    function saveLog( userId, {userName, firstName, lastName, email, role},  activity ) {
        console.log(userId, userName, activity);

        const userActivity = new  models.UserActivityLog({
            userId,
            userSnapshot: {userName, firstName, lastName, email, role},
            activityName: activity
        });

        userActivity.save()
        .then(result => {
            console.log('Success');
        })
        .catch(err => console.log('Error Saving Log',err))
    }
    
    /**
     * @name signIn
     * @param {*} req
     * @param {*} res
     */
    methods.signIn = async ( req, res, next ) => {
        const   userData = matchedData(req);
        logger.info('Login usuario');
        console.log(userData)
        try {
            // find user by username or email
            const user = await models.User.findOne({userName: userData.userName});
            logger.info(user)
            if (user) {
                const isequal = await bcrypt.compare(userData.password, user.passwordHash);
                console.log(user)
                if ( isequal ) {
                    if ( !user.isVerified )
                        throw { status: 401, code: 'NVERIF', message: 'You need to verify your email address in order to login'};
                    if ( !user.enabled )
                        throw { status:403, code:'UDISH',   message:'Your user has been disabled!' };
                    console.log('Sending the token', user);
                    let {_token : tokenGen, expiration} = await jwt.createAccessToken(user);
                    if ( user.secretToken === "")
                        user.secretToken = await jwt.createRefreshToken(user);

                    const saveResult = await user.save();
                    res.status(200)
                        .json({
                            token: tokenGen,
                            refreshToken: saveResult.secretToken,
                            expiration });
                            // saveLog(saveResult._id, {userName: saveResult.userName},`${saveResult.userName} joined us.`)

                } else
                    throw { status: 401, code: 'EPASSW', message: 'Wrong Password.' };
            } else {
                console.log('User not found!');
                throw { status: '401', code: 'NEXIST', message: 'User not found!' };
            }
        } catch( err ) {
            next( err );
        }
    };

    methods.getUsers = (req, res) => {
        // const filters = matchedData(req, {locations: ['query']});

        console.log(app.db);
        models.User
        .find({},'firstName lastName userName email role birthDate isVerified enabled createdAt')
        .populate('role')
        .exec()
        .then((result) => {
            res.status(200)
                .json(result);
        }).catch((error) => {
            res.status( error.status | 500)
                .json(error)
    })
    };

    methods.verifyEmail = ( req, res, next ) => {
        const data = req.params;

        models.User.findOne({ secretToken: data.token})
        .then(user => {
            console.log(user);

            if ( user ) {
                return user.verifyToken()
            } else {
                throw {
                    status: 400,
                    code: 'EVERIF',
                    message: "The verify token is not valid."
                }
            }
        })
        .then((result) => {
            res.status(200)
                .json({success: "Welcome to Seven for One, your email is verified!"})
        }).catch((err) => {
            next(err);
        });

    };

    methods.updateUser = (req, res) => {
        const userData = matchedData(req, { locations: ['body', 'query']});
        if ( userData.userId != req.user._id ) {
            return res.status(403)
                    .json({
                        status: 403,
                        code: 'EUNAUTH',
                        message: 'You cant not edit this User.'
                    });
        }
        models.User.updateUser( userData )
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
    };

    methods.changeStateUser = async ( req, res, next ) => {
        const data = matchedData(req, {locations: ['query', 'params']});

        try {
            const user = await models.User.findById( data.userId );
            if ( !user ) {
                res.status(400)
                    .json({failed: "User not found!"});
                return;
            }
            const action = data.enabled ? 'Enable' : 'Disable';
            user.secretToken = "";
            user.enabled = data.enabled;
            await user.save();
            res.status(200)
                .json({ success: 'User has been ' + action })
        } catch( _err ) {
            next(_err);
        }
    };

    methods.getAuthenticateUserInfo = ( req, res ) => {
        res.status(200)
            .json(req.user)
    };

    methods.refreshToken = async ( req, res, next ) => {
        const {refreshToken, userName} = matchedData(req, {locations: ['body']});

        try {
            const user = await models.User.findOne({ secretToken: refreshToken, userName});

            if ( !user ) throw {
                status: 401, code: 'DTOKEN',
                message: 'The refresh token is not valid.'
            };

            if( user._id.toString() !== req.user._id.toString() ) {
                throw {
                    status: 401, code:'ITOKEN',
                    message: 'The sent token does not belong to your User.',
                }
            }
            if ( user.enabled == 0 ) {
               throw {
                        status:403, code:'UDESH',
                        message:'Tu usuario se encuentra deshabilitado!'
                    };
            }
            const {_token : tokenGen, expiration} = await jwt.createToken(user);
                res.status(200)
                .json({
                    token: tokenGen,
                    refreshToken,
                    expiration
                });
            saveLog(user._id, {userName: user.userName},`${userName} refresh token.`)
        } catch( _err ) {
            next( _err );
        }
    };

    methods.getUser = (req, res, next) => {
        const userId = req.params.userId;

        models.User.findById( userId, 'firstName lastName userName email role birthDate isVerified secretToken phones enabledcreatedAt updatedAt' )
        .populate('role')
        .exec()
        .then( user => {
            resultOrNotFound( res, user, 'User');
        })
        .catch(err => next(err))
    };

    methods.getActivityTypes = (req, res, next ) => {
        models.ActivityTypes.find()
            .then( activities => res.status(200).json(activities))
            .catch(next)
    };

    return methods;
};