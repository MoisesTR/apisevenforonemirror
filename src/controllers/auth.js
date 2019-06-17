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

// Using require() in ES5
const FB = require('fb').default;

// GOOGLE AUTHENTICATION
// const CLIENT_ID = require('../config/config').CLIENT_ID;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

module.exports = app => {
    const URL_HOST  = process.env.URL_HOST ;
    const models = app.db.core.models;
    const jwt = app.services.jwt;
    const logger = app.utils.logger;
    let methods = {};


    methods.signInFacebook = async ( req, res, next ) => {
        const   userData    = matchedData(req);
        console.log(userData);

        FB.setAccessToken(userData.accessToken);
        FB.api(
            '/me',
            'GET',
            {"fields":"id,name,email,first_name,last_name,picture.width(300).height(300){url}"},
            async (response) => {

                if(!response || response.error) {
                    logger.info(!response ? 'error occurred' : response.error);
                    res.status(403).json({
                        ok : false
                        , message: !response ? 'error occurred' : response.error
                    });
                    return;
                }

                const facebookCredentials = {
                    firstName : response.first_name
                    , lastName: response.last_name
                    , email: response.email
                    , img: response.picture.data.url
                    , provider: 'facebook'
                };

                console.log('Facebook credentials' + facebookCredentials);
                verifyCredentialsFacebook(req, res, next, userData, facebookCredentials);
            }
        );

    };

    async function verifyCredentialsFacebook(req, res, next, userData, facebookCredentials) {

        try {

            const facebookUser = facebookCredentials;

            const user = await models.User.findOne({email: facebookUser.email}).populate('role');

            if (user) {
                if (user.provider === 'none') {
                    throw { status: 400, code: "AUTHNOR", message: "You must use your normal authentication!" };
                } else if (user.provider === 'google') {
                    throw { status: 400, code: "AUTHNOR", message: "This email already has a Registered Gmail account!" };
                } else {

                    let {_token : tokenGen, expiration} = await jwt.createAccessToken(user);
                    if ( user.secretToken === "") {
                        user.secretToken = await jwt.createRefreshToken(user);
                        logger.info('Create secret token');
                    }

                    const saveResult = await user.save();
                    user.passwordHash = '';

                    logger.info('Sending info to login');
                    res.status(200)
                        .json({
                            user: user
                            , token: tokenGen
                            , refreshToken: saveResult.secretToken
                            , expiration
                        });
                }
            } else {

                const dataLogin = await createUserWithSocialLogin(userData, facebookUser);

                logger.info('Sending info to login');
                res.status(200).json(dataLogin);
            }

        } catch ( _err ) {
            next(_err)
        }
    }

    //funcion registro
    methods.signInGoogle = async ( req, res, next ) => {
        const   userData    = matchedData(req);
        const accessToken = userData.accessToken;
        logger.info('Token google: ' + accessToken);

        const googleUser = await verify(accessToken).catch( () => {
            return res.status(403).json({
                ok : false
                , message: 'Token not valid!'
            });
        });

        if (!googleUser) return;

        try {

            const user = await models.User.findOne({email: googleUser.email}).populate('role');

            if (user) {
                if (user.provider === 'none') {
                    throw { status: 400, code: "AUTHNOR", message: "You must use your normal authentication!" };
                } else if (user.provider === 'facebook') {
                    throw { status: 400, code: "AUTHNOR", message: "This email already has a Registered Facebook account!" };
                } else {
     
                    let {_token : tokenGen, expiration} = await jwt.createAccessToken(user);
                    if ( user.secretToken === "") {
                        user.secretToken = await jwt.createRefreshToken(user);
                        logger.info('Create secret token');
                    }

                    const saveResult = await user.save();
                    user.passwordHash = '';

                    logger.info('Sending info to login');
                    res.status(200)
                    .json({
                        user: user
                        , token: tokenGen
                        , refreshToken: saveResult.secretToken
                        , expiration 
                    });
                } 

            } else {

                const dataLogin = await createUserWithSocialLogin(userData, googleUser);

                logger.info('Sending info to login');
                res.status(200).json(dataLogin);
            }

        } catch ( _err ) {
            next(_err)
        }
    };

    async function createUserWithSocialLogin(userData, socialUser) {

        userData.password = randomstring.generate(4);
        const secretToken = randomstring.generate(20);
        const hashPassw = await bcrypt.hash(userData.password, saltRounds);
        const randomUserName = generateRandomUserName(socialUser.email);

        const user = new models.User({
            firstName: socialUser.firstName,
            lastName: socialUser.lastName,
            userName: randomUserName,
            image: socialUser.img,
            provider: socialUser.provider,
            email: socialUser.email,
            passwordHash: hashPassw,
            role: userData.roleId,
            isVerified: true,
            secretToken: secretToken,
            enabled: true
        });

        const insertInfo =  await user.save();

        let {_token : tokenGen, expiration} = await jwt.createAccessToken(user);

        const userInfo = await models.User.findOne({email: socialUser.email}).populate('role');
        userInfo.passwordHash = '';

        logger.info('Token de usuario creado');

        return {
            user: userInfo
            , token: tokenGen
            , refreshToken: user.secretToken
            , expiration
        };
    }

    function generateRandomUserName(email) {
        const options = {
            min:  0
          , max:  999
          , integer: true
        };

        const number = randomNumber(options);
        const arrays = email.split('@') ;
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
        logger.info('Payload google user: ' + payload);
        console.log(payload);
        return {
            name: payload.name
            , firstName: payload.given_name
            , lastName: payload.family_name
            , email: payload.email
            , img: payload.picture
            , provider: 'google'
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
                throw { status: 401, code: "UEEXIST", message: "Not registered user, email and username are already registered!" };
                //res.status(401).json({code:"UEXIST",message:"No se registro el usuario, email o username ya registrados!"})
            } else if ( users.length === 1 ) {
                // if(usersfind[0].username == userData.username || usersfind[1].username== userData.username)
                if ( users[0].Username === userData.Username )
                    throw { status: 401, code: "UEXIST", message: 'The userName:' + userData.userName + ' already exists!' };
                else
                    throw { status: 401, code: "EEXIST", message: 'The user was not registered with email:' + userData.email + ', already registered!' };
            } else {
                const token = randomstring.generate(20);
                const user = new models.User({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    userName: userData.userName,
                    email: userData.email,
                    passwordHash: hashPassw,
                    phones: userData.phones,
                    role: userData.roleId,
                    birthDate: userData.birthDate,
                    gender: userData.gender,
                    isVerified: false,
                    secretToken:  token,
                    enabled: false
                });
                const insertInfo =  await user.save();

                res.status(201)
                    .json({
                        success: 'You have successfully registered, proceed to verify your email!'
                    });

                logger.info(`You're successfully registered, we're Sending the verification email`);
                transporter.sendMail({
                    to: userData.email,
                    from: 'no-reply@sevenforone.com',
                    subject:"Welcome to Seven for One! Confirm Your Email",
                    html: getHtml( insertInfo.userName, URL_HOST  + '/confirm/' + insertInfo.secretToken + "/" + insertInfo.userName)
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

    //TODO: manage the tokens in the database
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

        try {
            // find user by username or email
            const user = await models.User.findOne({$or: [{userName: userData.userName}, {email: userData.userName}]}).populate('role');
            if (user) {
                const isequal = await bcrypt.compare(userData.password, user.passwordHash);

                if ( isequal ) {

                    if ( !user.isVerified )
                        throw { status: 401, code: 'NVERIF', message: 'You need to verify your email address in order to login'};
                    if ( !user.enabled )
                        throw { status:403, code: 'UDISH',   message:'Your user has been disabled!' };

                    let {_token : tokenGen, expiration} = await jwt.createAccessToken(user);

                    // if ( user.secretToken === "") {
                    //     logger.info('Create refresh token');
                    //     user.secretToken = await jwt.createRefreshToken(user);
                    // }

                    const saveResult = await user.save();
                    user.passwordHash = '';

                    res.status(200)
                        .json({
                            user: user,
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
        .find({},'firstName lastName userName email role birthDate gender isVerified enabled createdAt')
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
        models.User.findById( userData.userId )
        .then( user => {
            if (!user)
                throw { status: 404, message:'User not found!'};
            return user.updateUser(userData)
        })
        .then( userUpdate => res.status(200)
            .json({
                status: 200,
                message: 'Usuario actualizado'
            })
        )
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
    methods.changePassword = async ( req, res, next ) => {
        const userData =  matchedData(req,{locations: ['body','params']});

        try {
            const user = await models.User.findById( userData.userId );
            if ( !user ) {
                throw {
                    status: 404,
                    message: 'User not found!'
                }
            }
            const hashPassw = await bcrypt.hash(userData.password, saltRounds);
            user.passwordHash =  hashPassw;
            await user.save();
            res.status(200)
                .json({
                    message: 'Password changed.'
                })
        } catch ( _er ) {
            next(_er);
        }
    };

    methods.getAuthenticateUserInfo = ( req, res ) => {
        delete req.user.passwordHash;
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
            const {_token : tokenGen, expiration} = await jwt.createRefreshToken(user);
                res.status(200)
                .json({
                    token: tokenGen,
                    refreshToken,
                    expiration
                });
            // saveLog(user._id, {userName: user.userName},`${userName} refresh token.`)
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
