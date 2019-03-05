const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// Evitar ataques basicos
const helmet = require('helmet');
// Compress Response
const compression = require('compression');

// Routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/authRoutes');
const mongoose = require('mongoose');

const app = express();

app.use(logger('dev'));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//Configuracion cabeceras y cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
})

app.use('/', indexRouter);
app.use('/auth', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    console.log('Middleware errores', err);
    
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500)
        .json(err);
});

mongoose.connect('mongodb:sevenone@seven7xone1//localhost:27017/sevenforone', {useNewUrlParser: true, useCreateIndex: true, ssl: true})
.then((result) => {
    console.log('Mongo is Connected');
})
.catch((err) => {
    console.log(err);
    process.exit();
})
module.exports = app;
