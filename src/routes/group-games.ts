import Express from 'express';
import {validsParams} from '../utils/genericsValidations';
import * as groupValidations from '../services/validations/game';
import Server from '../server';
import * as GameController from '../controllers/game';
import {app} from '../app';

export const register = (server: Server) => {
    const {ensureAuth} = server.jwt;
    const router = Express.Router();
    /* GET home page. */
    router.get('/', function(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
        res.send('<h1>API REST 7X1</h1>');
    });

    router
        .get('/game-groups', GameController.getGameGroups)
        .get('/game-groups/:groupId', ensureAuth, groupValidations.getGroup, validsParams, GameController.getGroupMembers)
        .post('/game-groups', ensureAuth, groupValidations.createGroup, validsParams, GameController.createGroup)
        .post('/game-groups/members/:groupId', ensureAuth, groupValidations.addMemberToGroup, validsParams, GameController.addMemberToGroup)
        .delete(
            '/game-groups/members/:groupId',
            ensureAuth,
            groupValidations.removeMemberFromGroup,
            validsParams,
            GameController.removeMemberFromGroup,
        )
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
