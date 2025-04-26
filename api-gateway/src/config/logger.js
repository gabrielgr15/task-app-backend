const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logsDirectory = path.join(__dirname, 'logs');
const fs = require('fs');
if (!fs.existsSync(logsDirectory)) {
    fs.mkdirSync(logsDirectory);
}

const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logsDirectory, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d', 
    level: 'debug'
});

const consoleTransport = new winston.transports.Console({
    level: 'debug',
});

const errorReplacer = (key, value) => {
    if (value instanceof Error) {      
      const error = {};
      Object.getOwnPropertyNames(value).forEach(function (propName) {
        error[propName] = value[propName];
      });      
      error.message = value.message;
      error.name = value.name;
      error.stack = value.stack;
      if (value.cause) {         
         error.cause = JSON.parse(JSON.stringify(value.cause, errorReplacer));
      }
      return error;
    }
    return value;
  };

  const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), 
        winston.format.splat(),
        
        winston.format.json({ replacer: errorReplacer, space: 2 }) 
        
    ),   
    transports: [
        fileRotateTransport,
        consoleTransport 
    ]
});

module.exports = logger;