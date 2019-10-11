import Express from 'express';
import {ensureAuth} from '../services/jwt';
import * as GameController from '../controllers/game';
import * as groupValidations from '../services/validations/game';
import {validsParams} from '../utils/genericsValidations';

const router = Express.Router();

router
    .route('/me')
    .get(ensureAuth, GameController.getOwnPurchaseHistory);

router.route('/:userId')
    .get(ensureAuth, groupValidations.userIdParam, validsParams, GameController.getPurchaseHistory);

export default router;
