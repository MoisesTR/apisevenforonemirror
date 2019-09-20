import Express from 'express';
import {validsParams} from '../utils/genericsValidations';
import * as paypalValidations from '../services/validations/paypal';
import * as paypalController from '../controllers/paypal';
import {ensureAuth} from '../services/jwt';

const router = Express.Router();
/* GET home page. */
router.get('/', function (req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    res.render('index', {title: 'Express'});
});

router
    .post(
        '/create-paypal-transaction',
        ensureAuth,
        paypalValidations.createPaypalTransaction,
        validsParams,
        paypalController.createPaypalTransaction,
    )
    .post('/authorize-paypal-transaction', ensureAuth, paypalController.createAuthorizationTransaction)
    .post('/payout', ensureAuth, paypalValidations.createPayout, validsParams, paypalController.payout)
    .post('/capture-authorization', ensureAuth, paypalController.captureAuthorization);

export default router;