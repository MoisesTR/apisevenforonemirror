const express   = require('expre' +
    'ss');
const consign   = require('consign');
const dotenv    = require('dotenv');
dotenv.config();

const app = express();

app.express = express;
    consign({
        cwd: __dirname
    })
        .include('config')
        .then('db/core.js')
        .then('services/jwt.js')
        .then('libs/middlewares.js')
        .then('libs/routes.js')
        .then('libs/paypalClient.js')
        .then('libs/error-middlewares.js')
        .then('libs/boot.js')
        .into(app);