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
    level: 'info',
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
          format.label({
            label: path.basename(caller)
          }),
          format.colorize(),
          format.splat(),
          format.printf(
            info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
          )
        )
      })
    ]
  });
};

module.exports = mLog;
