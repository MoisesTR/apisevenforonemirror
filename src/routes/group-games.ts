import Express from 'express';
import {validsParams} from '../utils/genericsValidations';
import * as groupValidations from '../services/validations/game';
import * as GameController from '../controllers/game';
import {ensureAuth, isAdmin} from '../services/jwt';
import {changeActiveStateMw} from '../services/validations';

const router = Express.Router();
router
    .route('/')
    .get(GameController.getGameGroups)
    .post(ensureAuth, isAdmin, groupValidations.createGroup, validsParams, GameController.createGroup);

router
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

router
    .route('/members/:groupId')
    .post(ensureAuth, groupValidations.addMemberToGroup, validsParams, GameController.addMemberToGroup)
    .delete(
        ensureAuth,
        isAdmin,
        groupValidations.removeMemberFromGroup,
        validsParams,
        GameController.removeMemberFromGroup,
    );

router
    .route('/:groupId')
    .get(ensureAuth, groupValidations.getGroup, validsParams, GameController.getGroupMembers)
    .delete(ensureAuth, isAdmin, changeActiveStateMw('groupId'), validsParams, GameController.changeActiveState);

export default router;
