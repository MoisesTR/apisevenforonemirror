import Express from 'express';
import {validsParams} from '../utils/genericsValidations';
import * as groupValidations from '../services/validations/game';
import * as GameController from '../controllers/game';
import {ensureAuth} from '../services/jwt';
import {changeActiveStateMw} from '../services/validations';

const router = Express.Router();
router
    .route('/')
    .get(GameController.getGameGroups)
    .post(ensureAuth, groupValidations.createGroup, validsParams, GameController.createGroup);

router
    .route('/:groupId')
    .get(ensureAuth, groupValidations.getGroup, validsParams, GameController.getGroupMembers)
    .delete(ensureAuth, changeActiveStateMw('groupId'), validsParams, GameController.changeActiveState);

router
    .route('/members/:groupId')
    .post(ensureAuth, groupValidations.addMemberToGroup, validsParams, GameController.addMemberToGroup)
    .delete(
        ensureAuth,
        groupValidations.removeMemberFromGroup,
        validsParams,
        GameController.removeMemberFromGroup,
    );

router
    .get('/purchase-history/me', ensureAuth, GameController.getOwnPurchaseHistory)
    .get('/purchase-history/:userId', ensureAuth, groupValidations.userIdParam, validsParams, GameController.getPurchaseHistory)
    .get('/me', ensureAuth, GameController.getMyCurrentsGroups)
    .get('/current/:userId', ensureAuth, groupValidations.userIdParam, validsParams, GameController.getCurrentGroups)
    .get(
        '/winners/last/:quantity(\\d+)/:groupId(\\w+)',
        ensureAuth,
        groupValidations.getLastWinners,
        validsParams,
        GameController.getGroupWinnersTop,
    )
    .get(
        '/winners/top/:quantity(\\d+)/:groupId?',
        ensureAuth,
        groupValidations.getTopWinners,
        validsParams,
        GameController.getTopWinners,
    );

export default router;
