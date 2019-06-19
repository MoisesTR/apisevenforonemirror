import Express from 'express';
import {validsParams} from '../utils/genericsValidations';
import * as groupValidations from '../services/validations/game';
import Server from '../server';
import GameController from '../controllers/game';

export const register = (server: Server) => {
    const gameController = new GameController(server);
    const { ensureAuth } = server.jwt;
    const router = Express.Router();
    /* GET home page. */
    router.get('/', function (req: Express.Request, res: Express.Response, next: Express.NextFunction) {
        res.send('<h1>This is a API Rest</h1>');
    });

    router
        .get('/game-groups', ensureAuth, gameController.getGameGroups)
        .get('/game-groups/:groupId', ensureAuth, groupValidations.getGroup, validsParams, gameController.getGroupMembers)
        .post('/game-groups', ensureAuth, groupValidations.createGroup, validsParams, gameController.createGroup)
        .post('/game-groups/members/:groupId', ensureAuth, groupValidations.addMemberToGroup, validsParams, gameController.addMemberToGroup)
        .delete('/game-groups/members/:groupId', ensureAuth, groupValidations.removeMemberFromGroup, validsParams, gameController.removeMemberFromGroup)
        .get('/purchase-history/me', ensureAuth, gameController.getOwnPurchaseHistory)
        .get('/purchase-history/:userId', ensureAuth, groupValidations.userIdParam, validsParams, gameController.getPurchaseHistory)
        .get('/me/game-groups', ensureAuth, gameController.getMyCurrentsGroups)
        .get('/game-groups/current/:userId', ensureAuth, groupValidations.userIdParam, validsParams, gameController.getCurrentGroups);

    server.app.use(router);
};
