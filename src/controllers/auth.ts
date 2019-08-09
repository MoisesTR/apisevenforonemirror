import Express, {NextFunction} from 'express';
import bcrypt from 'bcryptjs';
import randomstring from 'randomstring';
import randomNumber from 'random-number';
import {matchedData, remainigTimeInSeconds, resultOrNotFound} from '../utils/defaultImports';
import {OAuth2Client} from 'google-auth-library';
import {IModels} from '../db/core';
import Server from '../server';
import {IUserDocument} from '../db/interfaces/IUser';
import {IActivityTypesDocument} from '../db/interfaces/IActivityTypes';
import {Logger} from 'winston';
import envVars from '../global/environment';
import {IjwtResponse} from '../services/jwt';
import {redisPub} from '../redis/redis';
import DynamicKeys from '../redis/keys/dynamics';
import {recoverAccountEmail, sendConfirmationEmail} from '../services/email';
import {ERoles} from '../db/models/Role';
import {IRoleDocument} from '../db/interfaces/IRole';
import {UserForLoginType} from './interfaces/UserForLoginType';
import {ILoginResponse} from './interfaces/LoginResponse';
import User from '../db/models/User';
import catchAsync from '../utils/catchAsync';
import FB from 'fb';

const saltRounds = 10;

// Using require() in ES5

// GOOGLE AUTHENTICATION
const client = new OAuth2Client(envVars.GOOGLE_CLIENT_ID);

const generateRandomUserName = (email: string) => {
    const options = {
        min: 0,
        max: 999,
        integer: true,
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

    signInFacebook = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req);
        console.log(userData);

        FB.api(
            '/me',
            {fields: 'id,name,email,first_name,last_name,picture.width(300).height(300){url}', access_token: userData.accessToken},
            async (response?: any) => {
                if (!response || response.error) {
                    this.logger.info(!response ? 'error occurred' : response.error);
                    res.status(403).json({
                        ok: false,
                        message: !response ? 'error occurred' : response.error,
                    });
                    return;
                }

                const facebookCredentials = {
                    firstName: response.first_name,
                    lastName: response.last_name,
                    email: response.email,
                    img: response.picture.data.url,
                    provider: 'facebook',
                };

                console.log('Facebook credentials' + facebookCredentials);
                await this.verifyCredentialsFacebook(req, res, next, userData, facebookCredentials);
            },
        );
    });

    signInGoogle = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req);
        const accessToken = userData.accessToken;
        this.logger.info('Token google: ' + accessToken);

        const googleUser: any = await this.verify(accessToken);

        if (!googleUser) {
            res.status(403).json({
                ok: false,
                message: 'El token no es valido!',
            });
        }

        const user = await this.models.User.findOne({email: googleUser.email}).populate('role');

        if (user) {
            if (user.provider === 'none') {
                throw {status: 400, code: 'AUTHNOR', message: 'Debes usar la autenticacion normal(sin redes sociales)!'};
            } else if (user.provider === 'facebook') {
                throw {
                    status: 400,
                    code: 'AUTHNOR',
                    // message: 'This email already has a Registered Facebook account!'
                    message: 'Este correo ya se encuentra asociado a una cuenta de facebook!!!',
                };
            } else {
                const response = await this.getResponseToSendToLogin(user);
                res.status(200).json(response);
            }
        } else {
            const dataLogin = await this.createUserWithSocialLogin(userData, googleUser);

            this.logger.info('Sending info to login');
            res.status(200).json(dataLogin);
        }
    });

    //funcion registro
    createUserWithSocialLogin: (userData: any, socialUser: any) => Promise<ILoginResponse> = async (userData, socialUser) => {
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
            enabled: true,
        });

        const insertInfo = await user.save();

        const {_token: accessTokenGen, expiration} = await this.jwt.createAccessToken(user);
        const {_token: refreshTokenGen, expiration: expirationRefresh} = await this.jwt.createRefreshToken(user);

        const userInfo = await this.models.User.findOne({email: socialUser.email}).populate('role');
        if (!userInfo) {
            throw new Error('Error usuario no encontrado');
        }

        delete userInfo.passwordHash;

        this.logger.info('Token de usuario creado');

        await redisPub.setex(DynamicKeys.set.accessTokenKey(user.userName), remainigTimeInSeconds(expiration), accessTokenGen);
        await redisPub.setex(DynamicKeys.set.refreshKey(user.userName), remainigTimeInSeconds(expirationRefresh), refreshTokenGen);
        return {
            user: userInfo,
            token: accessTokenGen,
            refreshToken: refreshTokenGen,
            expiration: expiration,
        };
    };

    async verify(token: string) {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: envVars.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
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
            name: payload.name,
            firstName: payload.given_name,
            lastName: payload.family_name,
            email: payload.email,
            img: payload.picture,
            provider: 'google',
        };
    }

    signUp = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req);
        const hashPassw = await bcrypt.hash(userData.password, saltRounds);

        const users = await this.models.User.find({userName: userData.userName, email: userData.email});

        if (!users || users.length === 0) {
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
                enabled: false,
            });
            const insertInfo = await user.save();

            res.status(201).json({
                success: 'Se ha registrado correctamente, proceda a verificar su correo eletronico!',
            });

            this.logger.info(`You're successfully registered, we're Sending the verification email`);

            await sendConfirmationEmail(userData.email, user);
        }
        alreadyExist(users, userData);
    });

    /**
     * @name signIn
     * @param {*} req
     * @param {*} res
     */

    signInMiddleware = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req);
        this.logger.info('Login usuario');

        // find user by username or email
        const user = await this.models.User.findOne({$or: [{userName: userData.userName}, {email: userData.userName}]}).populate('role');
        if (user) {
            const isequal = await bcrypt.compare(userData.password, user.passwordHash);

            if (isequal) {
                if (!user.isVerified) {
                    throw {
                        status: 401,
                        code: 'NVERIF',
                        message: 'Necesitas verificar tu dirección de correo electrónico para iniciar sesión',
                    };
                }
                if (!user.enabled) {
                    throw {status: 403, code: 'UDISH', message: 'Tu usuario ha sido deshabilitado!'};
                }
                const response = await this.getResponseToSendToLogin(user);
                res.status(200).json(response);
            } else {
                throw {status: 401, code: 'EPASSW', message: 'Contrasenia erronea.'};
            }
        } else {
            console.log('User not found!');
            throw {status: '401', code: 'NEXIST', message: 'Usuario no encontrado!'};
        }
    });

    // GENERAL METHOD FOR GENERATE TOKEN AND REFRESH TOKEN, AND BUILD RESPONSE TO RETURN TO LOGIN
    async getResponseToSendToLogin(user: any) {
        const {expiration: expirationRefres, _token: _tokenRefresh} = await this.jwt.createRefreshToken(user, 10, 'minutes');
        const {_token: tokenGen, expiration} = await this.jwt.createAccessToken(user);

        // TODO: come back implement the browser agent store
        await redisPub.setex(DynamicKeys.set.refreshKey(user.userName), remainigTimeInSeconds(expirationRefres), _tokenRefresh);
        await redisPub.setex(DynamicKeys.set.accessTokenKey(user.userName), remainigTimeInSeconds(expiration), tokenGen);
        const response: ILoginResponse = {
            user: this.dataUserForLogin(user),
            token: tokenGen,
            refreshToken: _tokenRefresh,
            expiration,
        };
        this.logger.info(`User ${user.userName} logged`, {access: tokenGen, refresh: _tokenRefresh});
        return response;
    }

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

    getUsers = catchAsync(async (req: Express.Request, res: Express.Response) => {
        // const filters = matchedData(req, {locations: ['query']});

        const result = await this.models.User.find(
            {},
            'firstName lastName userName email role birthDate gender isVerified enabled createdAt',
        )
            .populate('role')
            .exec();
        res.status(200).json(result);
    });

    verifyEmail = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const data = req.params;

        const user: IUserDocument | null = await this.models.User.findOne({secretToken: data.token});
        console.log(user);

        if (!user) {
            throw {
                status: 400,
                code: 'EVERIF',
                message: 'El token de verificacion no es valido!',
            };
        }
        const result = await user.verifyToken();
        res.status(200).json({success: 'Bienvenido a Seven For One, su correo electrónico está verificado!'});
    });

    updateUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req, {locations: ['body', 'query']});
        if (userData.userId !== req.user._id) {
            return res.status(403).json({
                status: 403,
                code: 'EUNAUTH',
                message: 'No puedes editar este usuario',
            });
        }
        const user: IUserDocument | null = await this.models.User.findById(userData.userId);
        if (user == null) {
            throw {status: 404, message: 'User no encontrado!'};
        }
        const userUpdate: IUserDocument = await user.updateUser(userData);
        res.status(200).json({
            status: 200,
            message: 'Usuario actualizado',
        });
    });

    changeStateUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const data = matchedData(req, {locations: ['query', 'params']});

        console.log('Change state user');
        console.log(data);
        const user = await this.models.User.findById(data.userId);
        if (!user) {
            res.status(400).json({failed: 'Usuario no encontrado!'});
            return;
        }
        const action = data.enabled ? 'Habilitado' : 'Deshabilitado';
        user.secretToken = '';
        user.enabled = data.enabled;
        await user.save();
        res.status(200).json({success: 'El usuario ha sido' + action});
    });

    createAdminUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req);
        const user: IUserDocument = req.user;
        const adminRole: IRoleDocument | null = await this.models.Role.findOne({name: ERoles.ADMIN});
        if (!adminRole)
            throw {
                status: 500,
                message: 'Ha ocurrido un error!',
            };

        if (!user.role.equals(adminRole._id)) {
            return next({
                status: 401,
                message: 'No esta autorizado para utilizar este endpoint!',
            });
        }
        const users = await this.models.User.find({userName: userData.userName, email: userData.email});

        if (!users || users.length === 0) {
            const hashPassw = await bcrypt.hash(userData.password, saltRounds);
            const newAdmin = new this.models.User({
                firstName: userData.firstName,
                lastName: userData.lastName,
                userName: userData.userName,
                email: userData.email,
                passwordHash: hashPassw,
                role: userData.roleId,
                isVerified: true,
                enabled: true,
            });

            await newAdmin.save();
            res.status(201).json({
                userId: newAdmin._id,
                message: 'Nuevo administrador ' + userData.userName,
            });
        }
        alreadyExist(users, userData);
    });

    changePassword = async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req, {locations: ['body', 'params']});

        try {
            const user = await this.models.User.findById(userData.userId);
            if (!user) {
                throw {
                    status: 404,
                    message: 'Usuario no encontrado!',
                };
            }
            const hashPassw = await bcrypt.hash(userData.password, saltRounds);
            user.passwordHash = hashPassw;
            await user.save();
            // TODO: search if the user has logged
            // mainSocket.to().emit(CLOSE_SESSION, )
            res.status(200).json({
                message: 'Contraseña cambiada!',
            });
        } catch (_er) {
            next(_er);
        }
    };

    getAuthenticateUserInfo = (req: Express.Request, res: Express.Response) => {
        delete req.user.passwordHash;
        res.status(200).json(req.user);
    };

    refreshTokenMiddleware = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const {refreshToken, userName} = matchedData(req, {locations: ['body']});

        const user = await this.models.User.findOne({userName: userName});

        if (!user) {
            throw {
                status: 401,
                code: 'DTOKEN',
                message: 'El token de actualización no es valido!.',
            };
        }
        if (!user.enabled) {
            throw {
                status: 403,
                code: 'UDESH',
                message: 'Tu usuario se encuentra deshabilitado!',
            };
        }
        // get token username
        const redisRefreshToken = await redisPub.get(DynamicKeys.set.refreshKey(user.userName));
        if (!redisRefreshToken)
            throw {
                status: 401,
                code: 'ETOKEN',
                message: 'Tu token de actualización ha expirado!',
            };

        if (redisRefreshToken !== refreshToken) {
            throw {
                status: 401,
                code: 'TRNOTVAL',
                message: 'El token de actualización no es valido, vuelva a iniciar sesion!',
            };
        }
        const {_token: tokenGen, expiration} = await this.jwt.createAccessToken(user);
        await redisPub.setex(DynamicKeys.set.accessTokenKey(user.userName), remainigTimeInSeconds(expiration), tokenGen);

        this.logger.info('New access token for ' + user.userName, {token: tokenGen, refreshToken});
        res.status(200).json({
            token: tokenGen,
            expiration,
            refreshToken,
        });
        // saveLog(user._id, {userName: user.userName},`${userName} refresh token.`)
    });

    getUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userId = req.params.userId;

        const user = await this.models.User.findById(
            userId,
            'firstName lastName userName email role birthDate isVerified phones enabledcreatedAt updatedAt',
        )
            .populate('role')
            .exec();
        resultOrNotFound(res, user, 'User');
    });

    getEmailByUserName = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userName = req.params.userName;

        const user = await this.models.User.findOne({userName: userName});
        if (!user) {
            return res.status(404).json({message: 'Usuario no encontrado!'});
        } else if (!user.enabled) {
            return res.status(500).json({message: 'Tu cuenta ha sido deshabilitada!'});
        }

        // TODO: update that config
        const emailResp = await recoverAccountEmail(user.email, user);

        console.log('Email envado', emailResp);
        res.status(200).json({userName: userName, email: user.email});
    });

    recoverAccount = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const data = req.body;
        const condition: any = {};
        if (!!data.userName) {
            condition.userName = data.userName;
        } else {
            condition.email = data.email;
        }
        const user = await this.models.User.findOne({...condition});
        if (!user) {
            return res.status(404).json({message: 'Usuario no encontrado!'});
        }
        //TODO: Regresar
    });

    getActivityTypes = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const activities: IActivityTypesDocument[] = await this.models.ActivityTypes.find();
        res.status(200).json(activities);
    });

    private verifyCredentialsFacebook = async (
        req: Express.Request,
        res: Express.Response,
        next: NextFunction,
        userData: any,
        facebookCredentials: any,
    ) => {
        try {
            const facebookUser = facebookCredentials;

            const user = await this.models.User.findOne({email: facebookUser.email}).populate('role');

            if (user) {
                if (user.provider === 'none') {
                    throw {
                        status: 400,
                        code: 'AUTHNOR',
                        message: 'Ya tienes una cuenta con este correo, intenta utilizar la autenticacion por email (sin redes sociales)!',
                    };
                } else if (user.provider === 'google') {
                    throw {status: 400, code: 'AUTHNOR', message: 'Este correo ya se encuentra asociado a una cuenta de GMAIL'};
                } else {
                    if (!user.enabled) {
                        throw {status: 403, code: 'UDISHABLE', message: 'Usuario deshabilitado!'};
                    }
                    const response = await this.getResponseToSendToLogin(user);
                    res.status(200).json(response);
                }
            } else {
                const dataLogin = await this.createUserWithSocialLogin(userData, facebookUser);

                this.logger.info('Sending info to login');
                res.status(200).json(dataLogin);
            }
        } catch (_err) {
            next(_err);
        }
    };

    dataUserForLogin: (user: IUserDocument) => UserForLoginType = user => {
        return {
            _id: user._id,
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            provider: user.provider,
            role: user.role,
            email: user.email,
            image: user.image,
        };
    };
}

const alreadyExist = (users: IUserDocument[], userData: any) => {
    //Si se encontro mas de un usuario
    if (users.length > 1) {
        // console.log(usersfind.recordset[0])
        throw {
            status: 401,
            code: 'UEEXIST',
            message: 'Usuario no registrado, correo electronico y nombre de usuario ya estan registrados!',
        };
        //res.status(401).json({code:"UEXIST",message:"No se registro el usuario, email o username ya registrados!"})
    } else if (users.length === 1) {
        // if(usersfind[0].username == userData.username || usersfind[1].username== userData.username)
        if (users[0].userName === userData.Username) {
            throw {
                status: 401,
                code: 'UEXIST',
                message: 'El usuario:' + userData.userName + ' ya existe!',
            };
        } else {
            throw {
                status: 401,
                code: 'EEXIST',
                message: 'El usuario no se ha registrado con el correo electronico:' + userData.email + ', ya se encuentra registrado!',
            };
        }
    }
};
