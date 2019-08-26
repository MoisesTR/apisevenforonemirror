import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
/// Evitar ataques basicos
import helmet from 'helmet';
// Compress Response
import compression from 'compression';

export const apply = (app: express.Application, baseDir: string) => {
    app.use(logger('dev'));
    // Set security HTTP Headers
    app.use(helmet());
    app.use(compression());
    // Body parser, reading data from body into req.body
    app.use(express.json({ limit: '1kb'}));
    app.use(express.urlencoded({extended: false}));
    app.use(cookieParser());
    // Serving statics files
    app.use(express.static(path.join(baseDir, '..', 'public')));
};
