'use strict';

var path = require('path');
var express = require('express');
var session = require('express-session');
var MemcachedStore = require('connect-memcached')(session);
var passport = require('passport');
var config = require('./config');
var logging = require('./lib/logging');

var app = express();

app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('trust proxy', true);

// Add the request logger before anything else so that it can
// accurately log requests.
// [START requests]
app.use(logging.requestLogger);
// [END requests]

// Configure the session and session storage.
var sessionConfig = {
  resave: false,
  saveUninitialized: false,
  secret: config.get('SECRET'),
  signed: true
};


if (config.get('NODE_ENV') === 'production') {
  // In production use the App Engine Memcache instance to store session data,
  // otherwise fallback to the default MemoryStore in development.
  sessionConfig.store = new MemcachedStore({
    hosts: [config.get('MEMCACHE_URL')]
  });

  // set outh callback for production.
  config.set('OAUTH2_CALLBACK', 'https://notes-work.appspot.com/auth/google/callback');
}

app.use(session(sessionConfig));

// OAuth2
app.use(passport.initialize());
app.use(passport.session());
app.use(require('./lib/oauth2').router);

// Notes
app.use('/notes', require('./notes/crud'));
app.use('/api/notes', require('./notes/api'));

// Redirect root to /books
app.get('/', function (req, res) {
  res.redirect('/notes');
});

// Signin page
app.get('/signin', function (req, res) {
  res.render('signin.jade', {});
});

// Add the error logger after all middleware and routes so that
// it can log errors from the whole application. Any custom error
// handlers should go after this.
// [START errors]
app.use(logging.errorLogger);

// Basic 404 handler
app.use(function (req, res) {
  res.status(404).send('Not Found');
});

// Basic error handler
app.use(function (err, req, res, next) {
  // A workaround to retry request whenever there is some
  // arbit appengine error.
  res.redirect(req.originalUrl);
});
// [END errors]

if (module === require.main) {
  // Start the server
  var server = app.listen(config.get('PORT'), function () {
    var port = server.address().port;
    console.log('App listening on port %s', port);
  });
}

module.exports = app;
