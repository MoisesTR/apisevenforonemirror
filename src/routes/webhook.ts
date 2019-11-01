import Express from 'express';
import {validsParams} from '../utils/genericsValidations';
import * as paypalValidations from '../services/validations/paypal';
import * as webhookController from '../controllers/webhook';
import {ensureAuth} from '../services/jwt';
import {webhook} from 'controllers/webhook';

const router = Express.Router();

router.post('/webhook-paypal', webhookController.webhook);

export default router;
