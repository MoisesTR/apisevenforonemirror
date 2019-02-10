const {Router} = require('express');
const router  = Router();
// Controllers
const authController = require('../controllers/auth');
// Validations
const validations = require('../services/validations/auth');
// Utils
const { validsParams } = require('../utils/genericsValidations');

router
    .post('/signup',    validations.signUp,     validsParams,   authController.signUp)
    .post('/login',     validations.signIn,     validsParams,   authController.singIn)
    .get( '/users',     validations.getUsers,   validsParams,   authController.getUsers)
    .get( '/users/:userId', validations.getUser,    validsParams,   authController.getUser)
    // .put( '/user/:')
    // .post('/verifyUser/:token')
    // .get('/me/:token')
    // .delete('/user',)
    .get( '/roles\$',     authController.getRoles)
    .get( '/roles/:roleId', authController.getRole)
module.exports = router;