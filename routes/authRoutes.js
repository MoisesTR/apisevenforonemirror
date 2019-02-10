const {Router} = require('express');
const router  = Router();
// Controllers
const authController = require('../controllers/auth');
// Validations
const validations = require('../services/validations/auth');
// Utils
const { validsParams } = require('../utils/genericsValidations');
const { containToken, ensureAuth } = require('../services/jwt');

router
    .post('/signup',    validations.signUp,     validsParams,   authController.signUp)
    .post('/login',     validations.signIn,     validsParams,   authController.signIn)
    .get( '/users',     validations.getUsers,   validsParams,   authController.getUsers)
    .get( '/users/:userId', validations.getUser,    validsParams,   authController.getUser)
    .post('/refreshtoken', containToken, ensureAuth, validations.refreshToken, validsParams, authController.refreshToken)
    // .put( '/user/:')
    .post('/verifyemail/:token/:userName',   authController.verifyEmail)
    // .get('/me/:token')
    .delete('/users/:userId',    validations.changeStateUser,     validsParams,   authController.changeStateUser)
    .get( '/roles\$',     authController.getRoles)
    .get( '/roles/:roleId', authController.getRole)
module.exports = router;