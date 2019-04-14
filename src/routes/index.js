
module.exports =  app => {
  const router = app.express.Router();

  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  });

  app.use('/', router);
};