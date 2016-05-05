'use strict';

var winston = require('winston');
var expressWinston = require('express-winston');

var colorize = process.env.NODE_ENV !== 'production';

// Logger to capture all requests and output them to the console.
// [START requests]
var requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.Console({
      json: false,
      colorize: colorize
    })
  ],
  expressFormat: true,
  meta: false
});
// [END requests]

// Logger to capture any top-level errors and output json diagnostic info.
// [START errors]
var errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: colorize
    })
  ]
});
// [END errors]

module.exports = {
  requestLogger: requestLogger,
  errorLogger: errorLogger,
  error: winston.error,
  warn: winston.warn,
  info: winston.info,
  log: winston.log,
  verbose: winston.verbose,
  debug: winston.debug,
  silly: winston.silly
};
