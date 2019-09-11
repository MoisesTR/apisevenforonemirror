import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
/// Evitar ataques basicos
import helmet from 'helmet';
// Compress Response
import compression from 'compression';

// FILE UPLOAD
import fileUpload from "express-fileupload";

export const apply = (app: express.Application, baseDir: string) => {
    app.use(cookieParser());
    app.use(logger('dev'));
    app.use(fileUpload());
    // Set security HTTP Headers
    app.use(helmet({noCache: true}));
    app.use(compression());
    // Body parser, reading data from body into req.body
    app.use(express.json({ limit: '20kb'}));
    app.use(express.urlencoded({extended: false}));
    // Serving statics files
    app.use(express.static(path.join(baseDir, '..', 'public')));
};
