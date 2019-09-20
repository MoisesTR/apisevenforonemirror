import Express from 'express';
// Validations
import * as validations from '../services/validations/auth';
// Utils
import {validsParams} from '../utils/genericsValidations';
// Controllers
import * as authController from '../controllers/auth';
import {ensureAuth} from '../services/jwt';

const router = Express.Router();

// All these routes run below the path /api/auth
router
    .post('/signup', validations.signUp, validsParams, authController.signUp)
    .post('/login', validations.signIn, validsParams, authController.signInMiddleware)
    .post('/loginGoogle', validations.signInGoogle, validsParams, authController.signInGoogle)
    .post('/loginFacebook', validations.signInFacebook, validsParams, authController.signInFacebook)
    .post('/refreshtoken', validations.refreshToken, validsParams, authController.refreshTokenMiddleware)
    .post('/verifyemail/:token', authController.verifyEmail)
    .post('/recover', validations.recoverAccount, authController.forgotAccount);

router.use(ensureAuth)
    .get('/logout', authController.logout)
    .get('/activities', authController.getActivityTypes)
    .get('/me', authController.getAuthenticateUserInfo)
    .post('/admin', validations.createAdmin, validsParams, authController.createAdminUser)
    .get('/getImage/:folder/:img', authController.getImage)
    .put('/upload/:folder/:id', validations.uploadImage, validsParams, authController.upload)
    .put('/pwd/:userId', validations.changePassword, validsParams, authController.changePassword)
    .post('/verifyPwd/:userId', validations.verifyChangePassword, validsParams, authController.verifyChangePassword);


export default router;