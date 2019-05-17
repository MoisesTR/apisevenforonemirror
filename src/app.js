const express   = require('express');
const consign   = require('consign');
const path      = require('path');
const dotenv    = require('dotenv');
dotenv.config();

const app = express();

app.locals.baseDir = path.resolve(__dirname,'..');
app.express = express;
    consign({
        cwd: __dirname
    })
        .include('config')
        .then('utils/logger.js')
        .then('db/core.js')
        .then('services/jwt.js')
        .then('libs/middlewares.js')
        .then('libs/routes.js')
        .then('libs/paypalClient.js')
        .then('libs/error-middlewares.js')
        .then('libs/boot.js')
        .into(app);
