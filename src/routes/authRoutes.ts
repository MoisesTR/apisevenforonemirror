import Express from 'express';
// Validations
import * as validations from '../services/validations/auth';
// Utils
import {validsParams} from '../utils/genericsValidations';
// Controllers
import * as authController from '../controllers/auth';
import {app} from '../app';
import {ensureAuth} from '../services/jwt';
//
const router = Express.Router();

router
    .post('/signup', validations.signUp, validsParams, authController.signUp)
    .post('/login', validations.signIn, validsParams, authController.signInMiddleware)
    .post('/loginGoogle', validations.signInGoogle, validsParams, authController.signInGoogle)
    .post('/loginFacebook', validations.signInFacebook, validsParams, authController.signInFacebook)
    .post('/refreshtoken', validations.refreshToken, validsParams, authController.refreshTokenMiddleware)
    .post('/verifyemail/:token', authController.verifyEmail)
    .post('/recover', validations.recoverAccount, authController.forgotAccount)
    .get('/email/:userName', validations.getEmail, authController.getEmailByUserName);

router.use(ensureAuth)
    .get('/logout', authController.logout)
    .get('/activities', authController.getActivityTypes)
    .get('/me', authController.getAuthenticateUserInfo)
    .post('/admin', validations.createAdmin, validsParams, authController.createAdminUser)
    .get('/getImage/:folder/:img', authController.getImage)
    .put('/upload/:folder/:id', validations.uploadImage, validsParams, authController.upload);

export default router;