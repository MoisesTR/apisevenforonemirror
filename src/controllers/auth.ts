import Express, {NextFunction} from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import randomstring from 'randomstring';
import randomNumber from 'random-number';
import {matchedData, remainigTimeInSeconds} from '../utils/defaultImports';
import {OAuth2Client} from 'google-auth-library';
import {IUserDocument} from '../db/interfaces/IUser';
import {IActivityTypesDocument} from '../db/interfaces/IActivityTypes';
import envVars from '../global/environment';
import {redisPub} from '../redis/redis';
import DynamicKeys from '../redis/keys/dynamics';
import {recoverAccountEmail, sendConfirmationEmail} from '../services/email';
import {IRoleDocument} from '../db/interfaces/IRole';
import {UserForLoginType} from './interfaces/UserForLoginType';
import {ILoginResponse} from './interfaces/LoginResponse';
import User from '../db/models/User';
import catchAsync from '../utils/catchAsync';
import FB from 'fb';
import AppError from '../classes/AppError';
import fs from 'fs';
import path from 'path';
import logger from '../services/logger';
import {createAccessToken, createRefreshToken} from '../services/jwt';
import {ECookies} from './interfaces/ECookies';
import {ProviderEnum} from '../db/enums/ProvidersEnum';
import {EMainEvents} from '../sockets/constants/main';
import {sendMessageToConnectedUser} from '../sockets/socket';
import {ActivityTypes} from '../db/models';
import moment = require('moment');

const saltRounds = 10;

// Using require() in ES5

// GOOGLE AUTHENTICATION
const googleClient = new OAuth2Client(envVars.GOOGLE_CLIENT_ID);

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

export const signInFacebook = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userData = matchedData(req);
    console.log(userData);

    FB.api(
        '/me',
        {
            fields: 'id,name,email,first_name,last_name,picture.width(300).height(300){url}',
            access_token: userData.accessToken,
        },
        async (response?: any) => {
            if (!response || response.error) {
                logger.info(!response ? 'error occurred' : response.error);
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
            await verifyCredentialsFacebook(req, res, next, userData, facebookCredentials);
        },
    );
});

export const signInGoogle = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userData = matchedData(req);
    const accessToken = userData.accessToken;
    logger.info('Token google: ' + accessToken);

    const googleUser: any = await verify(accessToken);

    if (!googleUser) {
        return next(new AppError('No fue posible authenticarse con google.', 403, 'ITOKEN'));
    }

    const user = await User.findOne({email: googleUser.email}).populate('role');

    if (user) {
        if (!user.enabled) {
            return next(new AppError('Tu usuario se encuentra deshabilitado!', 403, 'UDISH'));
        }
        if (user.provider === 'none') {
            return next(new AppError('Debes usar la autenticacion con email y contraseña. (sin redes sociales)!', 400, 'AUTHNOR'));
        } else if (user.provider === 'facebook') {
            return next(new AppError('Este correo ya se encuentra asociado a una cuenta de facebook!!!', 400, 'AUTHNOR'));
        } else {
            const response = await getResponseToSendToLogin(req, res, user, userData.returnTokens);
            res.status(200).json(response);
        }
    } else {
        const dataLogin = await createUserWithSocialLogin(
            {
                ...userData,
                role: req.app.locals.roleUser._id,
            },
            googleUser,
        );

        logger.info('Sending info to login');
        res.status(200).json(dataLogin);
    }
});

//funcion registro
export const createUserWithSocialLogin: (userData: any, socialUser: any) => Promise<ILoginResponse> = async (userData, socialUser) => {
    userData.password = randomstring.generate(4);
    const hashPassw = await bcrypt.hash(userData.password, saltRounds);
    const randomUserName = generateRandomUserName(socialUser.email);

    const user = new User({
        firstName: socialUser.firstName,
        lastName: socialUser.lastName,
        userName: randomUserName,
        image: socialUser.img,
        provider: socialUser.provider,
        email: socialUser.email,
        passwordHash: hashPassw,
        role: userData.role || userData.roleId,
        isVerified: true,
        enabled: true,
    });

    const insertInfo = await user.save();

    const {_token: accessTokenGen, expiration} = await createAccessToken(user);
    const {_token: refreshTokenGen, expiration: expirationRefresh} = await createRefreshToken(user);

    const userInfo = await User.findOne({email: socialUser.email}).populate('role');
    if (!userInfo) {
        throw new AppError('Usuario no encontrado', 404, 'UNFOUND');
    }

    delete userInfo.passwordHash;

    logger.info('Token de usuario creado');

    await redisPub.setex(DynamicKeys.set.accessTokenKey(user.userName), remainigTimeInSeconds(expiration), accessTokenGen);
    await redisPub.setex(DynamicKeys.set.refreshKey(user.userName), remainigTimeInSeconds(expirationRefresh), refreshTokenGen);
    return {
        user: userInfo,
        token: accessTokenGen,
        refreshToken: refreshTokenGen,
        expiration: expiration,
    };
};

const verify = async (token: string) => {
    const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: envVars.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });

    const payload = ticket.getPayload();
    if (!payload) {
        throw new AppError('Ocurrio un error con la obtencion de tu informacion!', 403);
    }
    const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];
    // TODO: descomment
    // logger.info('Payload google user: ' + payload);
    console.log(payload);
    return {
        name: payload.name,
        firstName: payload.given_name,
        lastName: payload.family_name,
        email: payload.email,
        img: payload.picture,
        provider: 'google',
    };
};

export const signUp = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userData = matchedData(req);
    const hashPassw = await bcrypt.hash(userData.password, saltRounds);

    const users = await User.find({userName: userData.userName, email: userData.email});

    if (!users || users.length === 0) {
        const token = randomstring.generate(20);
        const user = new User({
            firstName: userData.firstName,
            lastName: userData.lastName,
            userName: userData.userName,
            email: userData.email,
            passwordHash: hashPassw,
            phones: userData.phones,
            role: userData.roleId || req.app.locals.roleUser._id,
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

        logger.info(`You're successfully registered, we're Sending the verification email`);

        await sendConfirmationEmail(userData.email, user);
    } else {
        alreadyExist(users, userData);
    }
});

/**
 * @name signIn
 * @param {*} req
 * @param {*} res
 */

export const signInMiddleware = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userData = matchedData(req);
    logger.info('Login usuario');

    // find user by username or email
    let user: IUserDocument | null = await User.findOne({$or: [{userName: userData.userName}, {email: userData.userName}]})
        .populate('role')
        .select('+passwordHash');
    if (!!user) {
        if (user.provider === 'google') {
            return next(
                new AppError(
                    `El correo ${user.email} ya se encuentra asociado a una cuenta de GMAIL, utiliza el login correspondiente!`,
                    400,
                    'AUTHNOR',
                ),
            );
        }
        if (user.provider === 'facebook') {
            return next(
                new AppError(
                    `El correo ${user.email} ya se encuentra asociado a una cuenta de Facebook, utiliza el login correspondiente!`,
                    400,
                    'AUTHNOR',
                ),
            );
        }
        const isequal = await bcrypt.compare(userData.password, user.passwordHash);

        if (isequal) {
            if (!user.isVerified) {
                return next(new AppError('Necesitas verificar tu dirección de correo electrónico para iniciar sesión', 401, 'NVERIF'));
            }
            if (!user.enabled) {
                return next(new AppError('Tu usuario ha sido deshabilitado!', 403, 'UDISH'));
            }
            const response = await getResponseToSendToLogin(req, res, user, userData.returnTokens);
            res.status(200).json(response);
        } else {
            next(new AppError('Contraseña erronea.', 401, 'EPASSW'));
        }
    } else {
        console.log('User not found!');
        next(new AppError('Usuario no encontrado!', 404, 'NEXIST'));
    }
});

// GENERAL METHOD FOR GENERATE TOKEN AND REFRESH TOKEN, AND BUILD RESPONSE TO RETURN TO LOGIN
export const getResponseToSendToLogin = async (req: Express.Request, res: Express.Response, user: any, returnTokens: boolean) => {
    const {expiration: expirationRefres, _token: _tokenRefresh} = await createRefreshToken(user, 10, 'minutes');
    const {_token: tokenGen, expiration} = await createAccessToken(user);

    res.cookie(ECookies._AccessToken, tokenGen, {
        expires: moment.unix(expirationRefres).toDate(),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    });
    res.cookie(ECookies._RefreshToken, _tokenRefresh, {
        expires: moment.unix(expirationRefres).toDate(),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    });
    // TODO: come back implement the browser agent store
    console.log(ECookies, process.env.NODE_ENV);
    await redisPub.setex(DynamicKeys.set.refreshKey(user.userName), remainigTimeInSeconds(expirationRefres), _tokenRefresh);
    await redisPub.setex(DynamicKeys.set.accessTokenKey(user.userName), remainigTimeInSeconds(expiration), tokenGen);
    let response: ILoginResponse = {
        user: dataUserForLogin(user)
    };
    if (returnTokens) {
        response = {
            ...response,
            token: tokenGen,
            refreshToken: _tokenRefresh,
            expiration,
        };
    }
    logger.info(`User ${user.userName} logged`, {access: tokenGen, refresh: _tokenRefresh});
    return response;
};

//TODO: manage the tokens in the database
// saveLog = (userId, {userName, firstName, lastName, email, role}, activity) => {
//     console.log(userId, userName, activity);
//
//     const userActivity = new UserActivityLog({
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

export const verifyEmail = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const data = req.params;

    const user: IUserDocument | null = await User.findOne({secretToken: data.token});
    console.log(user);

    if (!user) {
        return next(new AppError('El token de verificacion no es valido!', 400, 'EVERIF'));
    }
    const result = await user.verifyToken();
    res.status(200).json({success: 'Bienvenido a Seven For One, su correo electrónico ha sido verificado!'});
});

export const createAdminUser = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userData = matchedData(req);
    const user: IUserDocument = req.user;
    // const adminRole: IRoleDocument | null = await Role.findOne({name: ERoles.ADMIN});
    const adminRole: IRoleDocument = req.app.locals.adminRole;
    if (!adminRole) {
        return next(new AppError('The admin role doesn\'t exist!', 500, 'NAROLE'));
    }

    if (!user.role.equals(adminRole._id)) {
        return next(new AppError('No esta autorizado para utilizar este endpoint!', 403, 'NAUT'));
    }
    const users = await User.find({userName: userData.userName, email: userData.email});

    if (!users || users.length === 0) {
        const hashPassw = await bcrypt.hash(userData.password, saltRounds);
        const newAdmin = new User({
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

export const upload = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {

    const folder = req.params.folder;
    const id = req.params.id;

    // @ts-ignore
    const files = req.files;

    if (!files) {
        return next(new AppError('Debes seleccionar una imagen', 400, 'ERRIMG'));
    }

    // VALID FOLDER IMAGES
    const validsFolder = ['user', 'temp'];

    if (validsFolder.indexOf(folder) < 0) {
        return next(new AppError('El folder de la imagen no es valido!', 400, 'ERRIMG'));
    }

    // GET NAME FILE
    const file: any = files.data;
    const splitNameFile = file.name.split('.');
    const fileExt = splitNameFile[splitNameFile.length - 1].toLowerCase();

    // VALID EXTENSIONS FOR FILE
    const validExtensions = ['png', 'jpg', 'jpeg'];

    if (validExtensions.indexOf(fileExt) < 0) {
        return next(new AppError('Las extensiones validas son ' + validExtensions.join(' , '), 400, 'ERRIMG'));
    }

    // CUSTOM NAME
    const nameFile = crypto.randomBytes(15).toString('hex') + '.' + fileExt;

    // MOVE FILE TO TEMPORAL PATH
    const path = `src/uploads/${folder}/${nameFile}`;
    const pathViejo = `src/uploads/${folder}/`;

    file.mv(path, async (err: any) => {

        if (err) {
            return next(new AppError('Error al mover el archivo', 500, 'ERRIMG'));
        }

        const user: IUserDocument | null = await User.findById(id);
        if (user == null) {
            return next(new AppError('Usuario no encontrado', 404, 'UNFOUND'));
        }

        if (user.provider === ProviderEnum.NONE) {
            if (user.image) {
                fs.access(pathViejo + user.image, fs.constants.F_OK, (err) => {
                    if (err) {
                        console.log('ACCESS PATH ', err);
                        return next(new AppError('Ha ocurrido un error al eliminar la imagen anterior!', 400, 'ERRIMGDEL'));
                    }

                    fs.unlink(pathViejo + user.image, async (err) => {
                        console.log('DELETE IMAGE', err);

                        if (err) {
                            return next(new AppError('Ha ocurrido un error al eliminar la imagen anterior!', 400, 'ERRIMGDEL'));
                        }

                        user.image = nameFile;
                        await user.save();
                        res.status(200).json({
                            message: 'La imagen ha sido actualizada correctamente!',
                            image: nameFile
                        });
                    });
                });
            } else {
                user.image = nameFile;
                await user.save();
                res.status(200).json({message: 'La imagen ha sido actualizada correctamente!', image: nameFile});
            }
        } else {
            return next(new AppError('Solo usuarios que no esten asociados con redes sociales pueden actualizar la imagen de perfil!', 400, 'ERRUPDATEIMG'));
        }
    });
});

/**
 * FOLDER --folder where the image is located
 * IMG -- name of image to find
 * @param req
 * @param res
 */
export const getImage = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const folder = req.params.folder;
    const img = req.params.img;

    const pathImage = path.resolve(__dirname, `../uploads/${folder}/${img}`);

    if (fs.existsSync(pathImage)) {
        res.sendFile(pathImage);
    } else {
        const pathNoImage = path.resolve(__dirname, '../uploads/temp/no-img.jpg');
        res.sendFile(pathNoImage);
    }
});

export const changePassword = async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userData = matchedData(req, {locations: ['body', 'params']});

    try {
        const user = await User.findById(userData.userId);
        if (!user) {
            throw new AppError('Usuario no encontrado', 404, 'UNFOUND');
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

export const getAuthenticateUserInfo = (req: Express.Request, res: Express.Response) => {
    delete req.user.passwordHash;
    res.status(200).json(req.user);
};

export const refreshTokenMiddleware = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const {refreshToken, userName} = matchedData(req, {locations: ['body']});

    const user = await User.findOne({userName: userName});

    if (!user) {
        return next(new AppError('El token de actualización no es valido!.', 401, 'DTOKEN'));
    }
    if (!user.enabled) {
        return next(new AppError('Tu usuario se encuentra deshabilitado!', 403, 'UDESH'));
    }
    // get token username
    const redisRefreshToken = await redisPub.get(DynamicKeys.set.refreshKey(user.userName));
    if (!redisRefreshToken) {
        //TODO: FIgure out
        await sendMessageToConnectedUser(user.userName, EMainEvents.CLOSE_SESSION, {});
        return next(new AppError('Tu token de actualización ha expirado!', 401, 'ETOKEN'));
    }

    if (redisRefreshToken !== refreshToken) {
        return next(new AppError('El token de actualización no es valido, vuelva a iniciar sesion!', 401, 'TRNOTVAL'));
    }
    const {_token: tokenGen, expiration} = await createAccessToken(user);
    await redisPub.setex(DynamicKeys.set.accessTokenKey(user.userName), remainigTimeInSeconds(expiration), tokenGen);

    logger.info('New access token for ' + user.userName, {token: tokenGen, refreshToken});
    res.status(200).json({
        token: tokenGen,
        expiration,
        refreshToken,
    });
    // saveLog(user._id, {userName: user.userName},`${userName} refresh token.`)
});

export const forgotAccount = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const data = req.body;
    const condition: any = {};
    // 1) Determine the corresponding filter to GET the user
    if (!!data.userName) {
        condition.userName = data.userName;
    } else {
        condition.email = data.email;
    }
    // 2) Get user based on the above filter
    const user = await User.findOne({...condition});

    if (!user) {
        return next(new AppError('User not found!', 404, 'UNFOUND'));
    }
    // 3) Generate the random token and set it on the secretToken field of user, and return it (the not hashed)
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});
    console.log('Auth controller. forgot password', resetToken);

    // 4) Send it to user's email
    try {
        //TODO: return
        await recoverAccountEmail(user, '');

        res.status(200).json({
            status: 'success',
            message: 'Success, recover email successfully sent',
        });
    } catch (err) {
        user.secretToken = undefined;
        user.passwordResetExp = undefined;
        await user.save({validateBeforeSave: false});
    }
});

export const getActivityTypes = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const activities: IActivityTypesDocument[] = await ActivityTypes.find();
    res.status(200).json(activities);
});

export const verifyChangePassword = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
    const userData = matchedData(req, {locations: ['body', 'params']});
    const user: IUserDocument | null = await User.findOne({_id: userData.userId})
        .populate('role')
        .select('+passwordHash');

    if (user) {
        await checkPassword(userData, user, res, next);
    } else {
        console.log('User not found!');
        next(new AppError('Usuario no encontrado!', 404, 'NEXIST'));
    }

});

const checkPassword = async (userData: any, user: IUserDocument, res: Express.Response, next: NextFunction) => {

    const isequal = await bcrypt.compare(userData.password, user.passwordHash);
    if (isequal) {
        if (!user.isVerified) {
            return next(new AppError('Necesitas verificar tu dirección de correo electrónico para iniciar sesión', 401, 'NVERIF'));
        }
        if (!user.enabled) {
            return next(new AppError('Tu usuario ha sido deshabilitado!', 403, 'UDISH'));
        }
        res.status(200).json({message: 'Las contrasenia coinciden'});
    } else {
        next(new AppError('Contraseña erronea.', 401, 'EPASSW'));
    }
};

const verifyCredentialsFacebook = async (
    req: Express.Request,
    res: Express.Response,
    next: NextFunction,
    userData: any,
    facebookCredentials: any,
) => {
    const facebookUser = facebookCredentials;

    const user = await User.findOne({email: facebookUser.email}).populate('role');

    if (user) {
        if (!user.enabled) {
            return next(new AppError('Tu usuario se encuentra deshabilitado!', 403, 'UDISHABLE'));
        }
        if (user.provider === 'none') {
            return next(
                new AppError(
                    'Ya tienes una cuenta con este correo, intenta utilizar la autenticacion por email (sin redes sociales)!',
                    400,
                    'AUTHNOR',
                ),
            );
        } else if (user.provider === 'google') {
            return next(new AppError(`El correo ${user.email} ya se encuentra asociado a una cuenta de GMAIL.`, 400, 'AUTHNOR'));
        }
        const response = await getResponseToSendToLogin(req, res, user, false);
        res.status(200).json(response);
    } else {
        console.log('registration', req.app.locals);
        const dataLogin = await createUserWithSocialLogin(
            {
                ...userData,
                role: req.app.locals.roleUser._id,
            },
            facebookUser,
        );

        logger.info('Sending info to login');
        res.status(200).json(dataLogin);
    }
};

export const dataUserForLogin: (user: IUserDocument) => UserForLoginType = user => {
    return {
        _id: user._id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: user.provider,
        role: user.role,
        birthDate: user.birthDate,
        phones: user.phones,
        gender: user.gender,
        email: user.email,
        image: user.image,
        paypalEmail: user.paypalEmail
    };
};


export const resetPassword = catchAsync(async (req, res, next) => {
    //TODO: return
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        secretToken: hashedToken,
        passwordResetExp: {$gt: Date.now()},
    });

    // 2) If token has not expired, and there is user, set the new oassword
    if (!user) {
        return next(new AppError('Token is invalid or has expired!', 400));
    }

    user.passwordHash = req.body.password;
    user.secretToken = undefined;
    user.passwordResetExp = undefined;

    // 3) Updat changedPasswordAt property for the user
    await user.save({validateBeforeSave: true});
    // 4) Log the user in, send JWT
    // createSendToken(user, 200, res);
});

export const logout = (req: Express.Request, res: Express.Response, next: NextFunction) => {
    res.clearCookie(ECookies._AccessToken);
    res.clearCookie(ECookies._RefreshToken);
    res.status(200)
        .json({
            message: 'success'
        });
};

const alreadyExist = (users: IUserDocument[], userData: any) => {
    //Si se encontro mas de un usuario
    if (users.length > 1) {
        throw new AppError('Usuario no registrado, correo electronico y nombre de usuario ya estan registrados!', 401, 'UEEXIST');
    } else if (users.length === 1) {
        // if(usersfind[0].username == userData.username || usersfind[1].username== userData.username)
        if (users[0].userName === userData.Username) {
            throw new AppError('El usuario:' + userData.userName + ' ya existe!', 401, 'UEXIST');
        } else {
            throw new AppError(
                'El usuario no se ha registrado con el correo electronico:' + userData.email + ', ya se encuentra registrado!',
                401,
                'EEXIST',
            );
        }
    }
};
