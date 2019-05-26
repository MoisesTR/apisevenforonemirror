const { validsParams } = require('../utils/genericsValidations');

module.exports =  app => {
    const { containToken, ensureAuth } = app.services.jwt;
    const router = app.express.Router();
    const paypalController = require('../controllers/paypal')(app);
    const paypalValidations = require('../services/validations/paypal');

    /* GET home page. */
    router.get('/', function(req, res, next) {
        res.render('index', { title: 'Express' });
    });

    router
        .post('/create-paypal-transaction', ensureAuth,paypalValidations.createPaypalTransaction, validsParams, paypalController.createPaypalTransaction)
        .post('/authorize-paypal-transaction',ensureAuth,  paypalController.createAuthorizationTransaction)
        .post('/capture-authorization',ensureAuth,  paypalController.captureAuthorization);
    app.use('/', router);
};
