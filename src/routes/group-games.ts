import Express from 'express';
import {validsParams} from '../utils/genericsValidations';
import * as groupValidations from '../services/validations/game';
import Server from '../server';
import * as GameController from '../controllers/game';
import {app} from '../app';
import {ensureAuth} from '../services/jwt';

export const register = (server: Server) => {
    const router = Express.Router();
    /* GET home page. */
    router.get('/', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
        res.send('<h1>API REST 7X1</h1>');
    });

    router
        .route('/game-groups')
        .get( GameController.getGameGroups)
        .post( ensureAuth, groupValidations.createGroup, validsParams, GameController.createGroup)
        .delete(ensureAuth);

    router
        .get('/game-groups/:groupId', ensureAuth, groupValidations.getGroup, validsParams, GameController.getGroupMembers)

    router
        .route('/game-groups/members/:groupId')
        .post( ensureAuth, groupValidations.addMemberToGroup, validsParams, GameController.addMemberToGroup)
        .delete(
            ensureAuth,
            groupValidations.removeMemberFromGroup,
            validsParams,
            GameController.removeMemberFromGroup,
        );

    router
        .get('/purchase-history/me', ensureAuth, GameController.getOwnPurchaseHistory)
        .get('/purchase-history/:userId', ensureAuth, groupValidations.userIdParam, validsParams, GameController.getPurchaseHistory)
        .get('/me/game-groups', ensureAuth, GameController.getMyCurrentsGroups)
        .get('/game-groups/current/:userId', ensureAuth, groupValidations.userIdParam, validsParams, GameController.getCurrentGroups)
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

    app.use('/api', router);
};
