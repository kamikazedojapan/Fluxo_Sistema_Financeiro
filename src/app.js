const path = require('path');
const express = require('express');

const apiRoutes = require('./interfaces/http/routes');
const { notFoundHandler } = require('./interfaces/http/middlewares/notFoundHandler');
const { errorHandler } = require('./interfaces/http/middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');

app.use(express.json({ limit: '20kb' }));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;