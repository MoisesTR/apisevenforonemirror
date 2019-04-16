// Validations
const validations = require('../services/validations/auth');
// Utils
const { validsParams } = require('../utils/genericsValidations');

module.exports = app => {
    // Controllers
    const authController = require('../controllers/auth')(app);
    const roleController = require('../controllers/roles')(app);
    //
    const { containToken, ensureAuth } = app.services.jwt;

    const router  = app.express.Router();

    router
        .post('/signup',    validations.signUp,     validsParams,   authController.signUp)
        .post('/login',     validations.signIn,     validsParams,   authController.signIn)
        .post('/loginGoogle',     validations.signInGoogle,     validsParams,   authController.signInGoogle)
        .get( '/users',     validations.getUsers,   validsParams,   authController.getUsers)
        .get( '/users/:userId', validations.getUser,    validsParams,   authController.getUser)
        .post('/refreshtoken', containToken, ensureAuth, validations.refreshToken, validsParams, authController.refreshToken)
        .get('/activities', authController.getActivityTypes)
        .put( '/users/:userId', containToken, ensureAuth, validations.updateUser, validsParams, authController.updateUser)
        .post('/verifyemail/:token',   authController.verifyEmail)
        // .get('/me/:token')
        .delete('/users/:userId',    validations.changeStateUser,     validsParams,   authController.changeStateUser)
        .post('/roles\$', validations.createRole,   validsParams,   roleController.createRole)
        .get( '/roles\$',     roleController.getRoles)
        .get( '/roles/:roleId', roleController.getRole)

    app.use('/auth', router);
};
