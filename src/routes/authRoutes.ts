import Express from 'express';
// Validations
import * as validations from '../services/validations/auth';
// Utils
import {validsParams} from '../utils/genericsValidations';
import server from '../server';
// Controllers
import * as authController from '../controllers/auth';
import {app} from '../app';
import {ensureAuth} from '../services/jwt';
//
export const register = (server: server) => {
    const router = Express.Router();

    router
        .post('/signup', validations.signUp, validsParams, authController.signUp)
        .post('/login', validations.signIn, validsParams, authController.signInMiddleware)
        .post('/loginGoogle', validations.signInGoogle, validsParams, authController.signInGoogle)
        .post('/loginFacebook', validations.signInFacebook, validsParams, authController.signInFacebook)
        .post('/refreshtoken', validations.refreshToken, validsParams, authController.refreshTokenMiddleware)
        .get('/activities', ensureAuth, authController.getActivityTypes)
        .post('/verifyemail/:token', authController.verifyEmail)
        .get('/me', ensureAuth, authController.getAuthenticateUserInfo)
        .post('/recover', validations.recoverAccount, authController.forgotAccount)
        .get('/email/:userName', validations.getEmail, authController.getEmailByUserName)
        .post('/admin', ensureAuth, validations.createAdmin, validsParams, authController.createAdminUser)
        .get('/getImage/:folder/:img', ensureAuth, authController.getImage)
        .put('/upload/:folder/:id', ensureAuth, validations.uploadImage, validsParams , authController.upload);
    app.use('/api/auth', router);
};
