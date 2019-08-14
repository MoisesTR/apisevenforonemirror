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
import AppError from '../classes/AppError';

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
            return next(new AppError('El token no es valido', 403, 'ITOKEN'));
        }

        const user = await this.models.User.findOne({email: googleUser.email}).populate('role');

        if (user) {
            if (user.provider === 'none') {
                return next(new AppError('Debes usar la autenticacion normal(sin redes sociales)!', 400, 'AUTHNOR'));
            } else if (user.provider === 'facebook') {
                return next(new AppError('Este correo ya se encuentra asociado a una cuenta de facebook!!!', 400, 'AUTHNOR'));
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
            throw new AppError('Usuario no encontrado', 404,'UNFOUND');
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
            throw new AppError('Payload is empty', 403);
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
                    return next(new AppError('Necesitas verificar tu dirección de correo electrónico para iniciar sesión',401, 'NVERIF'));
                }
                if (!user.enabled) {
                    return next(new AppError('Tu usuario ha sido deshabilitado!',403, 'UDISH'));
                }
                const response = await this.getResponseToSendToLogin(user);
                res.status(200).json(response);
            } else {
                next(new AppError('Contraseña erronea.',401, 'EPASSW'));
            }
        } else {
            console.log('User not found!');
             next( new AppError('Usuario no encontrado!',404, 'NEXIST'));
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
            return next(new AppError('El token de verificacion no es valido!', 400, 'EVERIF'));
        }
        const result = await user.verifyToken();
        res.status(200).json({success: 'Bienvenido a Seven For One, su correo electrónico está verificado!'});
    });

    updateUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userData = matchedData(req, {locations: ['body', 'query']});
        if (userData.userId !== req.user._id) {
            return next( new AppError('No puedes editar este usuario', 403,'EUNAUTH'));
        }
        const user: IUserDocument | null = await this.models.User.findById(userData.userId);
        if (user == null) {
            return next(new AppError('Usuario no encontrado', 404,'UNFOUND'));
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
            return next(new AppError('The admin role doesn\'t exist!', 500,'NAROLE'));

        if (!user.role.equals(adminRole._id)) {
            return next(new AppError('No esta autorizado para utilizar este endpoint!', 403,'NAUT'));
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
                throw new AppError('Usuario no encontrado', 404,'UNFOUND');
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
            return next(new AppError('El token de actualización no es valido!.', 401, 'DTOKEN'));
        }
        if (!user.enabled) {
            return next(new AppError('Tu usuario se encuentra deshabilitado!', 403, 'UDESH'));
        }
        // get token username
        const redisRefreshToken = await redisPub.get(DynamicKeys.set.refreshKey(user.userName));
        if (!redisRefreshToken)
            return next(new AppError('Tu token de actualización ha expirado!', 401, 'ETOKEN'));

        if (redisRefreshToken !== refreshToken) {
            return next(new AppError('El token de actualización no es valido, vuelva a iniciar sesion!',401, 'TRNOTVAL'));
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
        resultOrNotFound(res, user, 'User', next);
    });

    getEmailByUserName = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const userName = req.params.userName;

        const user = await this.models.User.findOne({userName: userName});
        if (!user) {
            return next(new AppError('User not found!', 404,'UNFOUND'));
        } else if (!user.enabled) {
            return next(new AppError('Usuario deshabilitado, contacte con el soporte de 7x1!.', 403, 'EPUSER'));
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
            return next(new AppError('User not found!', 404,'UNFOUND'));
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
            const facebookUser = facebookCredentials;

            const user = await this.models.User.findOne({email: facebookUser.email}).populate('role');

            if (user) {
                if (user.provider === 'none') {
                    return next( new AppError('Ya tienes una cuenta con este correo, intenta utilizar la autenticacion por email (sin redes sociales)!',400, 'AUTHNOR'));
                } else if (user.provider === 'google') {
                    return next( new AppError('Este correo ya se encuentra asociado a una cuenta de GMAIL',400, 'AUTHNOR'));
                } else {
                    if (!user.enabled) {
                        return next( new AppError('Usuario deshabilitado!',403, 'UDISHABLE'));
                    }
                    const response = await this.getResponseToSendToLogin(user);
                    res.status(200).json(response);
                }
            } else {
                const dataLogin = await this.createUserWithSocialLogin(userData, facebookUser);

                this.logger.info('Sending info to login');
                res.status(200)
                    .json(dataLogin);
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
        throw new AppError('Usuario no registrado, correo electronico y nombre de usuario ya estan registrados!',401, 'UEEXIST');
    } else if (users.length === 1) {
        // if(usersfind[0].username == userData.username || usersfind[1].username== userData.username)
        if (users[0].userName === userData.Username) {
            throw new AppError('El usuario:' + userData.userName + ' ya existe!',401, 'UEXIST');
        } else {
            throw new AppError('El usuario no se ha registrado con el correo electronico:' + userData.email + ', ya se encuentra registrado!',401, 'EEXIST');
        }
    }
};
