import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
// @ts-ignore
import xss from 'xss-clean';
/// Evitar ataques basicos
import helmet from 'helmet';
// Compress Response
import compression from 'compression';

export const apply = (app: express.Application, baseDir: string) => {
    app.use(cookieParser());
    app.use(logger('dev'));
    // Set security HTTP Headers
    app.use(helmet({noCache: true}));
    app.use(compression());
    //Data Sanitization against XSS
    app.use(xss());
    // Body parser, reading data from body into req.body
    app.use(express.json({ limit: '20kb'}));
    app.use(express.urlencoded({extended: true}));
    // Serving statics files
    app.use(express.static(path.join(baseDir, '..', 'public')));
};
