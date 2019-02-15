// Simple logging functions for seeing workings of app
'use strict';

const {
  createLogger,
  format,
  transports
} = require('winston');
const path = require('path');
const appRoot = require('app-root-path');

const mLog = caller => {
  return createLogger({
    level: 'debug',
    format: format.combine(
      format.label({
        label: path.basename(caller)
      }),
      format.colorize(),
      format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.splat(),
      format.printf(info => {
        if (info.meta && info.meta instanceof Error) {
          return `${info.timestamp} ${info.level} ${info.message} : ${info.meta.stack}`;
        }
        return `${info.timestamp} ${info.level}: ${info.message}`;
     })
    ),
    transports: [ new transports.Console() ]
  });
};

module.exports = mLog;
