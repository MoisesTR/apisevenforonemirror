import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
/// Evitar ataques basicos
import helmet from 'helmet';
// Compress Response
import compression from 'compression';


app.use(logger('dev'));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(app.locals.baseDir, 'public')));
