import Express, {NextFunction} from "express";

export const apply = (app: Express.Application) => {

    app.use(function (req: Express.Request, res: Express.Response, next: NextFunction) {
        let err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handler
    app.use(function (err: Error, req: Express.Request, res: Express.Response, next: NextFunction) {
        // set locals, only providing error in development
        console.log('Middleware errores', err);

        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        res.status(err.status || 500)
            .json(err);
    });
    // catch 404 and forward to error handler
};
