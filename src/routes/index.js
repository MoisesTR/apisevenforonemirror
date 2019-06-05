const { validsParams } = require('../utils/genericsValidations');

module.exports =  app => {
  const { containToken, ensureAuth } = app.services.jwt;
  const router = app.express.Router();
  const gameController = require('../controllers/game')(app);
  const groupValidations = require('../services/validations/game');

  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.send('<h1>This is a API Rest</h1>');
  });

  router
      .get('/game-groups',  ensureAuth, gameController.getGameGroups)
      .get('/game-groups/:groupId', ensureAuth, groupValidations.getGroup, validsParams, gameController.getGroupMembers)
      .post('/game-groups', ensureAuth, groupValidations.createGroup, validsParams, gameController.createGroup)
      .post('/game-groups/members/:groupId', ensureAuth, groupValidations.addMemberToGroup,  validsParams, gameController.addMemberToGroup)
      .delete('/game-groups/members/:groupId',  ensureAuth, groupValidations.removeMemberFromGroup, validsParams, gameController.removeMemberFromGroup)
      .get('/purchase-history/me',   ensureAuth, gameController.getOwnPurchaseHistory)
      .get('/purchase-history/:userId',   ensureAuth, groupValidations.userIdParam, validsParams, gameController.getPurchaseHistory)
      .get('/me/game-groups', ensureAuth, gameController.getMyCurrentsGroups)
      .get('/game-groups/current/:userId',   ensureAuth, groupValidations.userIdParam, validsParams,gameController.getCurrentGroups)
  app.use('/', router);
};
