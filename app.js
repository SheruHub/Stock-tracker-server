require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const stocksRouter = require('./routes/stocks');
const helmet = require('helmet');
const cors = require("cors")
const swaggerUI = require("swagger-ui-express")
yaml = require('yamljs');
swaggerDocument = yaml.load('./docs/swagger.yaml');

const fs = require('fs');
const https = require('https');
const privateKey = fs.readFileSync('/etc/ssl/private/node-selfsigned.key','utf8');
const certificate = fs.readFileSync('/etc/ssl/certs/node-selfsigned.crt','utf8');
const credentials = {
	key: privateKey,
	cert: certificate
};

const app = express();
const knex = require('knex')(require('./knexfile'))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//app.use(logger('dev'));

function logOriginalUrl(req, res, next) {
	console.log('Request URL:', req.originalUrl);
	next()
}

function logMethod(req, res, next) {
	console.log('Request Type:', req.method)
	next()
}

const doLogs = [logOriginalUrl, logMethod]

app.use(logger('common'));
app.use(helmet());
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
	req.db = knex;
	next()
})


logger.token("req", (req, res) => JSON.stringify(req.headers))
logger.token("res", (req, res) => {
  const headers = {}
  res.getHeaderNames().map((h) => (headers[h] = res.getHeader(h)))
  return JSON.stringify(headers)
})

//app.use('/$', doLogs, indexRouter);
app.use('/user', doLogs, userRouter);
app.use('/stocks', doLogs, stocksRouter);
app.use("/", swaggerUI.serve, swaggerUI.setup(swaggerDocument));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

const server = https.createServer(credentials,app);
server.listen(443);

module.exports = app;
