module.exports = app => {

    // Routes
    const indexRouter = require('../routes/index')(app);
    const authRouter  = require('../routes/authRoutes')(app);
};