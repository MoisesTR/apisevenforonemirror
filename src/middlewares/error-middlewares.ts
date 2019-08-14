import Express, {NextFunction} from "express";
import {Errors} from "../db/models/ErrorREST";
import AppError from '../classes/AppError';

export const apply = (app: Express.Application) => {

    app.use(function (req: Express.Request, res: Express.Response, next: NextFunction) {
        const err = new AppError(Errors.BadRequest.message, Errors.BadRequest.status);
        next(err);
    });

    const sendErrorDEv = ( err: Error | AppError, res: Express.Response) => {
        res.status(err.status || 500 )
            .json({
                code: err.code || 'error',
                message: err.message,
                stack: err.stack,
                error: err
            });
    };
    // error handler
    app.use(function (err: Error | AppError, req: Express.Request, res: Express.Response, next: NextFunction) {
        // set locals, only providing error in development
        console.log("Middleware errores", err);

        res.locals.message = err.message;
        res.locals.error = req.app.get("env") === "development" ? err : {};
        if ( process.env.NODE_ENV === 'development' ) {
            sendErrorDEv(err, res);
        } else if ( process.env.NODE_ENV === 'production' ) {
            res.status(err.status || 500)
                .json(err);
        } else {
            throw Error('This is not a valid NODE_ENV');
        }
    });
    // catch 404 and forward to error handler
};
