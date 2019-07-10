import Express from 'express';
// Validations
import * as validations from '../services/validations/auth';
// Utils
import {validsParams} from '../utils/genericsValidations';
import server from "../server";
// Controllers
import {UserController} from '../controllers/auth'
import RoleController from '../controllers/roles'
import {app} from '../app';
//
export const register = (server: server) => {
    const router = Express.Router();
    const {ensureAuth} = server.jwt;
    const authController = new UserController(server);
    const roleController = new RoleController(server);

    router
        .post('/signup', validations.signUp, validsParams, authController.signUp)
        .post('/login', validations.signIn, validsParams, authController.signInMiddleware)
        .post('/loginGoogle', validations.signInGoogle, validsParams, authController.signInGoogle)
        .post('/loginFacebook', validations.signInFacebook, validsParams, authController.signInFacebook)
        .get('/users', validations.getUsers, validsParams, authController.getUsers)
        .get('/users/:userId', validations.getUser, validsParams, authController.getUser)
        .post('/refreshtoken', ensureAuth, validations.refreshToken, validsParams, authController.refreshTokenMiddleware)
        .get('/activities', ensureAuth, authController.getActivityTypes)
        .put('/users/:userId', ensureAuth, validations.updateUser, validsParams, authController.updateUser)
        .put('/users/pwd/:userId', ensureAuth, validations.changePassword, validsParams, authController.changePassword)
        .post('/verifyemail/:token', authController.verifyEmail)
        .get('/me', ensureAuth, authController.getAuthenticateUserInfo)
        .delete('/users/:userId', validations.changeStateUser, validsParams, authController.changeStateUser)
        .post('/roles\$', validations.createRole, validsParams, roleController.createRole)
        .get('/roles\$', roleController.getRoles)
        .get('/roles/:roleId', roleController.getRole)
        .post('/recover',   validations.recoverAccount, authController.recoverAccount)
        .get('/email/:userName', validations.getEmail, authController.getEmailByUserName);
    app.use('/api/auth', router);
}
