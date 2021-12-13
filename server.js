// ENVIRONMENT VARIABLES
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const compression = require('compression')
const helmet = require('helmet');
const app = express();
const port = 8081;

const utils = require('./utils');
const config = require('./config/config');
const context = {
    config,
    utils,
    app
};

// COMPRESSION
app.use(compression());

// BODY PARSER
app.use(express.urlencoded({
    extended: true
}));

app.use(express.json({ limit: '5mb' }));

// extra security
app.use(helmet());

require('./modules/sync/sync.job')(context);
require('./modules/drink/drink.route')(context);

// error handling
app.use(function (err, req, res, next) {
    'use strict';

    console.error('Error middleware: ' + err);
    res.status(400).send('Unexpected error!');
});

app.listen(port);
console.log(`>> [MINNOW POD API]: started API on port ${port}`);