const { validsParams } = require('../utils/genericsValidations');

module.exports =  app => {
  const { containToken, ensureAuth } = app.services.jwt;
  const router = app.express.Router();
  const gameController = require('../controllers/game')(app);
  const groupValidations = require('../services/validations/game');

  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  });

  router
      .get('/game-groups',  containToken, ensureAuth, gameController.getGameGroups)
      .get('/game-groups/:groupId', containToken, ensureAuth, groupValidations.getGroup, validsParams, gameController.getGroupMembers)
      .post('/game-groups', containToken, ensureAuth, groupValidations.createGroup, validsParams, gameController.createGroup)
      .post('/game-groups/members/:groupId', containToken, ensureAuth, groupValidations.addMemberToGroup,  validsParams, gameController.addMemberToGroup)
      .delete('/game-groups/members/:groupId',  containToken,ensureAuth, groupValidations.removeMemberFromGroup, validsParams, gameController.removeMemberFromGroup)
      .get('/purchase-history/me',   containToken, ensureAuth, gameController.getOwnPurchaseHistory)
      .get('/purchase-history/:userId',   containToken, ensureAuth, gameController.getPurchaseHistory)

  app.use('/', router);
};