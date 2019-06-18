
module.exports = app => {
    // catch 404 and forward to error handler
    app.use(function(req: Express.Request, res: Express.Response, next: NextFunction) {
        let err = new Error('Not Found');
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
};
