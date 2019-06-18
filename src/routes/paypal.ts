import {validsParams} from '../utils/genericsValidations';
import paypalValidations from '../services/validations/paypal';
import paypalController from '../controllers/paypal';

const {containToken, ensureAuth} = app.services.jwt;
const router = app.express.Router();

/* GET home page. */
router.get('/', function (req: Express.Request, res: Express.Response, next: NextFunction) {
    res.render('index', {title: 'Express'});
});

router
    .post('/create-paypal-transaction', ensureAuth, paypalValidations.createPaypalTransaction, validsParams, paypalController.createPaypalTransaction)
    .post('/authorize-paypal-transaction', ensureAuth, paypalController.createAuthorizationTransaction)
    .post('/capture-authorization', ensureAuth, paypalController.captureAuthorization);
app.use('/', router);
