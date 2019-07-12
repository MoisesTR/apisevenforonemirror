import Express, {NextFunction} from 'express';
import bcrypt from 'bcryptjs';
import randomstring from 'randomstring';
import randomNumber from 'random-number';
// To send Mails
import nodemailer from 'nodemailer';
// @ts-ignore
import sendgridTransport from 'nodemailer-sendgrid-transport';
import {matchedData, remainigTimeInSeconds, resultOrNotFound} from '../utils/defaultImports';
import {getHtml} from '../utils/verifyEmailUtil';
import {OAuth2Client} from 'google-auth-library';
import {IModels} from '../db/core';
import Server from '../server';
import {IUserDocument} from '../db/interfaces/IUser';
import {IActivityTypesDocument} from '../db/interfaces/IActivityTypes';
import {Logger} from 'winston';
import envVars from '../global/environment';
import {IjwtResponse} from '../services/jwt';
import {redisPub} from '../redis/redis';
import {getRecoverHtml} from '../utils/recoverAccountEmail';
// import {refreshKey, tokenKey} from '../redis/keys/dynamics';
import DynamicKeys from '../redis/keys/dynamics';
import moment = require('moment');

const saltRounds = 10;
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

// Using require() in ES5
const FB = require('fb').default;

// GOOGLE AUTHENTICATION
const client = new OAuth2Client(envVars.GOOGLE_CLIENT_ID);

const generateRandomUserName = (email: string) => {
    const options = {
        min: 0
        , max: 999
        , integer: true
    };

    const numberGenerate = randomNumber(options);
    const arrays = email.split('@');
    return arrays[0] + numberGenerate;
};

export class UserController {
    private models: IModels;
    private logger: Logger;
    private jwt: IjwtResponse;

    constructor(server: Server) {
        this.models = server.dbCore.models;
        this.logger = server.logger;
        this.jwt = server.jwt;
    }

    signInFacebook = async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req);
        console.log(userData);

        FB.setAccessToken(userData.accessToken);
        FB.api(
            '/me',
            'GET',
            {'fields': 'id,name,email,first_name,last_name,picture.width(300).height(300){url}'},
            async (response?: any) => {

                if (!response || response.error) {
                    this.logger.info(!response ? 'error occurred' : response.error);
                    res.status(403).json({
                        ok: false
                        , message: !response ? 'error occurred' : response.error
                    });
                    return;
                }

                const facebookCredentials = {
                    firstName: response.first_name
                    , lastName: response.last_name
                    , email: response.email
                    , img: response.picture.data.url
                    , provider: 'facebook'
                };

                console.log('Facebook credentials' + facebookCredentials);
                await this.verifyCredentialsFacebook(req, res, next, userData, facebookCredentials);
            }
        );

    };

    signInGoogle = async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req);
        const accessToken = userData.accessToken;
        this.logger.info('Token google: ' + accessToken);

        const googleUser: any = await this.verify(accessToken)
            .catch(() => {
                return res.status(403).json({
                    ok: false
                    , message: 'Token not valid!'
                });
            });

        if (!googleUser) {
            return;
        }

        try {

            const user = await this.models.User
                .findOne({email: googleUser.email}).populate('role');

            if (user) {
                if (user.provider === 'none') {
                    throw {status: 400, code: 'AUTHNOR', message: 'You must use your normal authentication!'};
                } else if (user.provider === 'facebook') {
                    throw {
                        status: 400,
                        code: 'AUTHNOR',
                        message: 'This email already has a Registered Facebook account!'
                    };
                } else {

                    let {_token: tokenGen, expiration} = await this.jwt.createAccessToken(user);
                    console.log('Creando token, expira', expiration, moment.unix(expiration).diff(moment(), 'seconds'));
                    const refreshKey = await redisPub.get(DynamicKeys.set.refreshKey(user.userName));
                    if (!refreshKey) {
                        const _tokenRefres = await this.jwt.createRefreshToken(user);
                        user.secretToken = _tokenRefres._token;
                        this.logger.info('Create secret token');
                        // redisPub.hset(user.userName, "refresh", _tokenRefres._token);
                        await redisPub.setex(DynamicKeys.set.refreshKey(user.userName), moment.unix(_tokenRefres.expiration).diff(moment(), 'seconds'), _tokenRefres._token);
                    }
                    //TODO: come back
                    // redisPub.setex(tokenKey(user.userName),  moment.unix(expiration).diff(moment(),'seconds'), tokenGen);
                    const saveResult = await user.save();
                    user.passwordHash = '';

                    this.logger.info('Sending info to login');
                    res.status(200)
                        .json({
                            user: {_id: user._id, userName: user.userName, role: user.role}
                            , token: tokenGen
                            , refreshToken: saveResult.secretToken
                            , expiration
                        });
                }

            } else {

                const dataLogin = await this.createUserWithSocialLogin(userData, googleUser);

                this.logger.info('Sending info to login');
                res.status(200).json(dataLogin);
            }

        } catch (_err) {
            next(_err);
        }
    };

    //funcion registro
    async createUserWithSocialLogin(userData: any, socialUser: any) {

        userData.password = randomstring.generate(4);
        const hashPassw = await bcrypt.hash(userData.password, saltRounds);
        const randomUserName = generateRandomUserName(socialUser.email);

        const user = new this.models.User({
            firstName: socialUser.firstName,
            lastName: socialUser.lastName,
            userName: randomUserName,
            image: socialUser.img,
            provider: socialUser.provider,
            email: socialUser.email,
            passwordHash: hashPassw,
            role: userData.roleId,
            isVerified: true,
            enabled: true
        });

        const insertInfo = await user.save();

        let {_token: accessTokenGen, expiration} = await this.jwt.createAccessToken(user);
        let {_token: refreshTokenGen, expiration: expirationRefresh} = await this.jwt.createRefreshToken(user);

        let userInfo = await this.models.User.findOne({email: socialUser.email}).populate('role');
        if (!userInfo) {
            throw new Error('Error usuario no encontrado');
        }
        delete userInfo.passwordHash;

        this.logger.info('Token de usuario creado');

        await redisPub.setex(DynamicKeys.set.accessTokenKey(user.userName), remainigTimeInSeconds(expiration), accessTokenGen);
        await redisPub.setex(DynamicKeys.set.refreshKey(user.userName), remainigTimeInSeconds(expirationRefresh), refreshTokenGen);
        return {
            user: userInfo
            , token: accessTokenGen
            , refreshToken: refreshTokenGen
            , expiration: expirationRefresh
        };
    }

    async verify(token: string) {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: envVars.GOOGLE_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Payload is empty');

        }
        const userid = payload['sub'];
        // If request specified a G Suite domain:
        //const domain = payload['hd'];
        // TODO: descomment
        // this.logger.info('Payload google user: ' + payload);
        console.log(payload);
        return {
            name: payload.name
            , firstName: payload.given_name
            , lastName: payload.family_name
            , email: payload.email
            , img: payload.picture
            , provider: 'google'
        };
    }

    signUp = async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req);
        try {
            const hashPassw = await bcrypt.hash(userData.password, saltRounds);

            const users = await this.models.User.find({userName: userData.userName, email: userData.email});
            //Si se encontro mas de un usuario
            if (users.length > 1) {
                // console.log(usersfind.recordset[0])
                throw {
                    status: 401,
                    code: 'UEEXIST',
                    message: 'Not registered user, email and username are already registered!'
                };
                //res.status(401).json({code:"UEXIST",message:"No se registro el usuario, email o username ya registrados!"})
            } else if (users.length === 1) {
                // if(usersfind[0].username == userData.username || usersfind[1].username== userData.username)
                if (users[0].userName === userData.Username) {
                    throw {
                        status: 401,
                        code: 'UEXIST',
                        message: 'The userName:' + userData.userName + ' already exists!'
                    };
                } else {
                    throw {
                        status: 401,
                        code: 'EEXIST',
                        message: 'The user was not registered with email:' + userData.email + ', already registered!'
                    };
                }
            } else {
                const token = randomstring.generate(20);
                const user = new this.models.User({
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
                    secretToken: token,
                    enabled: false
                });
                const insertInfo = await user.save();

                res.status(201)
                    .json({
                        success: 'You have successfully registered, proceed to verify your email!'
                    });

                this.logger.info(`You're successfully registered, we're Sending the verification email`);
                transporter.sendMail({
                    to: userData.email,
                    from: 'no-reply@sevenforone.com',
                    subject: 'Welcome to Seven for One! Confirm Your Email',
                    html: getHtml(insertInfo.userName, envVars.URL_HOST + '/confirm/' + insertInfo.secretToken + '/' + insertInfo.userName)
                })
                    .then((result) => {
                        console.log('Email envado', result);

                    }).catch((err) => {
                    console.log('Error enviando', err);

                });
            }
            // next();
        } catch (_err) {
            // res.status( _err.status || 500)
            //     .json( _err )
            next(_err);
        }
    };

    /**
     * @name signIn
     * @param {*} req
     * @param {*} res
     */

    signInMiddleware = async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req);
        this.logger.info('Login usuario');

        try {
            // find user by username or email
            const user = await this.models.User.findOne({$or: [{userName: userData.userName}, {email: userData.userName}]}).populate('role');
            if (user) {
                const isequal = await bcrypt.compare(userData.password, user.passwordHash);

                if (isequal) {

                    if (!user.isVerified) {
                        throw {
                            status: 401,
                            code: 'NVERIF',
                            message: 'You need to verify your email address in order to login'
                        };
                    }
                    if (!user.enabled) {
                        throw {status: 403, code: 'UDISH', message: 'Your user has been disabled!'};
                    }

                    let {expiration: expirationRefres, _token: _tokenRefresh} = await this.jwt.createRefreshToken(user, 5, 'hours');
                    let {_token: tokenGen, expiration} = await this.jwt.createAccessToken(user);

                    // TODO: come back implement the browser agent store
                    await redisPub.setex(DynamicKeys.set.refreshKey(user.userName), remainigTimeInSeconds(expirationRefres), _tokenRefresh);
                    await redisPub.setex(DynamicKeys.set.accessTokenKey(user.userName), remainigTimeInSeconds(expiration), tokenGen);
                    res.status(200)
                        .json({
                            user: {_id: user._id, userName: user.userName, email: user.email},
                            token: tokenGen,
                            refreshToken: _tokenRefresh,
                            expiration
                        });
                    // saveLog(saveResult._id, {userName: saveResult.userName},`${saveResult.userName} joined us.`)
                } else {
                    throw {status: 401, code: 'EPASSW', message: 'Wrong Password.'};
                }
            } else {
                console.log('User not found!');
                throw {status: '401', code: 'NEXIST', message: 'User not found!'};
            }
        } catch (err) {
            next(err);
        }
    };

    //TODO: manage the tokens in the database
    // saveLog = (userId, {userName, firstName, lastName, email, role}, activity) => {
    //     console.log(userId, userName, activity);
    //
    //     const userActivity = new models.UserActivityLog({
    //         userId,
    //         userSnapshot: {userName, firstName, lastName, email, role},
    //         activityName: activity
    //     });
    //
    //     userActivity.save()
    //         .then(result => {
    //             console.log('Success');
    //         })
    //         .catch(err => console.log('Error Saving Log', err))
    // }

    getUsers = (req: Express.Request, res: Express.Response) => {
        // const filters = matchedData(req, {locations: ['query']});

        // console.log(app.db);
        this.models.User
            .find({}, 'firstName lastName userName email role birthDate gender isVerified enabled createdAt')
            .populate('role')
            .exec()
            .then((result: any) => {
                res.status(200)
                    .json(result);
            }).catch((error: Error) => {
            res.status(error.status || 500)
                .json(error);
        });
    };

    verifyEmail = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const data = req.params;

        this.models.User.findOne({secretToken: data.token})
            .then((user: IUserDocument | null) => {
                console.log(user);

                if (!user) {
                    throw ({
                        status: 400,
                        code: 'EVERIF',
                        message: 'The verify token is not valid.'
                    });
                }
                return user.verifyToken();
            })
            .then((result) => {
                res.status(200)
                    .json({success: 'Welcome to Seven for One, your email is verified!'});
            }).catch((err) => {
            next(err);
        });

    };

    updateUser = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req, {locations: ['body', 'query']});
        if (userData.userId != req.user._id) {
            return res.status(403)
                .json({
                    status: 403,
                    code: 'EUNAUTH',
                    message: 'You cant not edit this User.'
                });
        }
        this.models.User.findById(userData.userId)
            .then((user: IUserDocument | null) => {
                if (user == null) {
                    throw {status: 404, message: 'User not found!'};
                }
                return user.updateUser(userData);
            })
            .then((userUpdate: IUserDocument) => res.status(200)
                .json({
                    status: 200,
                    message: 'Usuario actualizado'
                })
            )
            .catch((err: any) => {
                next(err);
            });
    };

    changeStateUser = async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const data = matchedData(req, {locations: ['query', 'params']});

        try {
            const user = await this.models.User.findById(data.userId);
            if (!user) {
                res.status(400)
                    .json({failed: 'User not found!'});
                return;
            }
            const action = data.enabled ? 'Enable' : 'Disable';
            user.secretToken = '';
            user.enabled = data.enabled;
            await user.save();
            res.status(200)
                .json({success: 'User has been ' + action});
        } catch (_err) {
            next(_err);
        }
    };

    changePassword = async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req, {locations: ['body', 'params']});

        try {
            const user = await this.models.User.findById(userData.userId);
            if (!user) {
                throw {
                    status: 404,
                    message: 'User not found!'
                };
            }
            const hashPassw = await bcrypt.hash(userData.password, saltRounds);
            user.passwordHash = hashPassw;
            await user.save();
            // TODO: search if the user has logged
            // mainSocket.to().emit(CLOSE_SESSION, )
            res.status(200)
                .json({
                    message: 'Password changed.'
                });
        } catch (_er) {
            next(_er);
        }
    };

    getAuthenticateUserInfo = (req: Express.Request, res: Express.Response) => {
        delete req.user.passwordHash;
        res.status(200)
            .json(req.user);
    };

    refreshTokenMiddleware = async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const {refreshToken, userName} = matchedData(req, {locations: ['body']});

        try {

            const user = req.user;
            // get token username
            const redisRefreshToken = await redisPub.get(DynamicKeys.set.refreshKey(user.userName));
            if( !redisRefreshToken )
                throw {
                    status: 401, code: 'ETOKEN',
                    message: 'Your refresh token was expired!'
                }

            if (!user) {
                throw {
                    status: 401, code: 'DTOKEN',
                    message: 'The refresh token is not valid.'
                };
            }

            if (redisRefreshToken !== refreshToken) {
                throw ({
                    status: 401, code: 'TRNOTVAL',
                    message: 'Refresh Token not valid, please login again!'
                });
            }
            // if (user._id.toString() !== req.user._id.toString()) {
            //     throw {
            //         status: 401, code: 'ITOKEN',
            //         message: 'The sent token does not belong to your User.',
            //     }
            // }
            if (!user.enabled) {
                throw {
                    status: 403, code: 'UDESH',
                    message: 'Tu usuario se encuentra deshabilitado!'
                };
            }
            const {_token: tokenGen, expiration} = await this.jwt.createAccessToken(user);
            await redisPub.setex(DynamicKeys.set.accessTokenKey(user.userName), remainigTimeInSeconds(expiration), tokenGen);

            res.status(200)
                .json({
                    token: tokenGen,
                    refreshToken,
                    expiration
                });
            // saveLog(user._id, {userName: user.userName},`${userName} refresh token.`)
        } catch (_err) {
            next(_err);
        }
    };

    getUser = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userId = req.params.userId;

        this.models.User.findById(userId, 'firstName lastName userName email role birthDate isVerified secretToken phones enabledcreatedAt updatedAt')
            .populate('role')
            .exec()
            .then(user => {
                resultOrNotFound(res, user, 'User');
            })
            .catch(err => next(err));
    };

    getEmailByUserName = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userName = req.params.userName;

        this.models.User.findOne({userName: userName})
            .then(user => {
                if (!user) {
                    return res.status(404).json({message: 'User not found!'});
                } else if (!user.enabled) {
                    return res.status(500).json({message: 'Your account has been disabled!'});
                }
                // TODO: manage  email
                transporter.sendMail({
                    to: user.email,
                    from: 'no-reply@sevenforone.com',
                    subject: 'Dont Reply! Recover your Account',
                    html: getRecoverHtml(user.userName, envVars.URL_HOST + '/confirm/')
                })
                    .then((result) => {
                        console.log('Email envado', result);
                    }).catch((err) => {
                    console.log('Error enviando', err);

                });
                res.status(200)
                    .json({userName: userName, email: user.email});
            })
            .catch(next);
    };
    recoverAccount = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const data = req.body;
        let condition: any = {};
        if (!!data.userName) {
            condition.userName = data.userName;
        } else {
            condition.email = data.email;
        }
        this.models.User.findOne({...condition})
            .then(user => {
                if (!user) {
                    return res.status(404).json({message: 'User not found!'});
                }
                //TODO: Regresar

            })
            .catch(next);
    };

    getActivityTypes = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        this.models.ActivityTypes.find()
            .then((activities: IActivityTypesDocument[]) => res.status(200).json(activities))
            .catch(next);
    };

    private verifyCredentialsFacebook = async (req: Express.Request, res: Express.Response, next: NextFunction, userData: any, facebookCredentials: any) => {

        try {

            const facebookUser = facebookCredentials;

            const user = await this.models.User.findOne({email: facebookUser.email}).populate('role');

            if (user) {
                if (user.provider === 'none') {
                    throw {status: 400, code: 'AUTHNOR', message: 'You must use your normal authentication!'};
                } else if (user.provider === 'google') {
                    throw {status: 400, code: 'AUTHNOR', message: 'This email already has a Registered Gmail account!'};
                } else {

                    let {_token: tokenGen, expiration} = await this.jwt.createAccessToken(user);
                    if (user.secretToken === '') {
                        const _tempToken = await this.jwt.createRefreshToken(user);
                        user.secretToken = _tempToken._token;
                        await redisPub.hmset(DynamicKeys.set.refreshKey(user.userName), ['_token', _tempToken._token, 'expiration', _tempToken.expiration]);
                        this.logger.info('Create secret token');
                    }

                    const saveResult = await user.save();
                    user.passwordHash = '';

                    this.logger.info('Sending info to login');
                    res.status(200)
                        .json({
                            user: user
                            , token: tokenGen
                            , refreshToken: saveResult.secretToken
                            , expiration
                        });
                }
            } else {

                const dataLogin = await this.createUserWithSocialLogin(userData, facebookUser);

                this.logger.info('Sending info to login');
                res.status(200).json(dataLogin);
            }

        } catch (_err) {
            next(_err)
        }
    }
}
