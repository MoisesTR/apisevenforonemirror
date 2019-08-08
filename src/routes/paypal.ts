import Express from 'express';
import {validsParams} from '../utils/genericsValidations';
import * as paypalValidations from '../services/validations/paypal';
import * as paypalController from '../controllers/paypal';
import Server from "../server";
import {app} from '../app';


export const register = (server: Server) => {
    const router = Express.Router();
    const { ensureAuth } = server.jwt;
    /* GET home page. */
    router.get('/', function (req: Express.Request, res: Express.Response, next: Express.NextFunction) {
        res.render('index', {title: 'Express'});
    });

    router
        .post('/create-paypal-transaction', ensureAuth, paypalValidations.createPaypalTransaction, validsParams, paypalController.createPaypalTransaction)
        .post('/authorize-paypal-transaction', ensureAuth, paypalController.createAuthorizationTransaction)
        .post('/capture-authorization', ensureAuth, paypalController.captureAuthorization);
    app.use('/api', router);
}
