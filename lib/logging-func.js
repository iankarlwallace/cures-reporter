// Simple logging functions for seeing workings of app
'use strict';

const { createLogger, format, transports } = require('winston');
const appRoot = require('app-root-path');

const mLog = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console({
      level: 'info',
      format: format.combine(
        format.colorize(),
        format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
    new transports.File({ appRoot + '/log/cures-reporter.log' })
  ]
});

module.exports = mLog;
