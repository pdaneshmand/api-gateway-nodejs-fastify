/**
 * Logging Configuration
 * * This section is very important
 * * You can manaage logger setting for app
 * * Logging mode : DB, File and console
 */
import * as _ from 'lodash';
const winston = require('winston');
const winistonMongoDB = require('winston-mongodb').MongoDB;

const loggingMode =
  process.env.NODE_ENV === 'Production'
    ? process.env.LOG_PROD_MODE
    : process.env.LOG_DEV_MODE;

const winsDBLogger =
  loggingMode === 'DB'
    ? winston.createLogger({
        format: winston.format.combine(
          winston.format.errors({ stack: true }), // log the full stack
          winston.format.timestamp(), // get the time stamp part of the full log message
          winston.format.printf(({ level, message, timestamp, stack }) => {
            // formating the log outcome to show/store
            return `${timestamp} ${level}: ${message} - ${stack}`;
          }), // >>>> ADD THIS LINE TO STORE the ERR OBJECT IN META field
          winston.format.metadata(),
        ),
        transports: [
          new winston.transports.MongoDB({
            handleRejections: true,
            // prettyPrint: true,
            db:
              process.env.NODE_ENV === 'Production'
                ? process.env.MONGO_AUTH_ENABLE_PROD === 'YES'
                  ? `mongodb://${process.env.MONGO_USERNAME_PROD}:${process.env.MONGO_PASSWORD_PROD}@${process.env.MONGO_HOST_PROD}:${process.env.MONGO_PORT_PROD}/${process.env.MONGO_DATABASE_PROD}`
                  : `mongodb://${process.env.MONGO_HOST_PROD}:${process.env.MONGO_PORT_PROD}/${process.env.MONGO_DATABASE_PROD}`
                : process.env.MONGO_AUTH_ENABLE_DEV === 'YES'
                ? `mongodb://${process.env.MONGO_USERNAME_DEV}:${process.env.MONGO_PASSWORD_DEV}@${process.env.MONGO_HOST_DEV}:${process.env.MONGO_PORT_DEV}/${process.env.MONGO_DATABASE_DEV}`
                : `mongodb://${process.env.MONGO_HOST_DEV}:${process.env.MONGO_PORT_DEV}/${process.env.MONGO_DATABASE_DEV}`,
            collection: 'applogs',
            storeHost: true,
            capped: true,
            options: {
              useNewUrlParser: true,
              useUnifiedTopology: true,
            },
          }),
        ],
      })
    : {};

const winsFileLogger =
  loggingMode === 'FILE'
    ? winston.createLogger({
        format: winston.format.combine(
          winston.format.errors({ stack: true }), // log the full stack
          winston.format.timestamp(), // get the time stamp part of the full log message
          winston.format.printf(({ level, message, timestamp, stack }) => {
            // formating the log outcome to show/store
            return `${timestamp} ${level}: ${message} - ${stack}`;
          }), // >>>> ADD THIS LINE TO STORE the ERR OBJECT IN META field
          winston.format.metadata(),
          winston.format.json(),
        ),
        transports: [
          new winston.transports.File({
            filename: process.env.LOG_COMBINED_FILE_URL,
            level: 'info',
            handleRejections: true,
            // prettyPrint: true,
            storeHost: true,
          }),
          new winston.transports.File({
            filename: process.env.LOG_ERROR_FILE_URL,
            level: 'error',
            handleRejections: true,
            // prettyPrint: true,
            storeHost: true,
          }),
          new winston.transports.Http({
            level: 'warn',
            filename: process.env.LOG_HTTP_FILE_URL,
            handleRejections: true,
            // prettyPrint: true,
            storeHost: true,
          }),
        ],
        rejectionHandlers: [
          new winston.transports.File({
            filename: process.env.LOG_REJECTION_FILE_URL,
            handleRejections: true,
            // prettyPrint: true,
            storeHost: true,
          }),
        ],
        exceptionHandlers: [
          new winston.transports.File({
            filename: process.env.LOG_EXCEPTIONS_FILE_URL,
            handleRejections: true,
            // prettyPrint: true,
            storeHost: true,
          }),
        ],
      })
    : {};

const winsConsoleLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.errors({ stack: true }), // log the full stack
    winston.format.timestamp(), // get the time stamp part of the full log message
    winston.format.printf(({ level, message, timestamp, stack }) => {
      // formating the log outcome to show/store
      return `${timestamp} ${level}: ${message} - ${stack}`;
    }), // >>>> ADD THIS LINE TO STORE the ERR OBJECT IN META field
    winston.format.json(),
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.metadata(),
  ),
  transports: [
    new winston.transports.Console({
      handleRejections: true,
      // prettyPrint: true,
      colorize: true,
      storeHost: true,
    }),
  ],
});
const log = console.log;
export default class logger {
  public static error(
    data: any,
    message: string = '',
    methodType: string = 'GET',
    logMode: string = loggingMode,
  ) {
    this.createLog(data, message, methodType, 'error', logMode);
  }

  public static info(
    data: any,
    message: string = '',
    methodType: string = 'GET',
    logMode: string = loggingMode,
  ) {
    this.createLog(data, message, methodType, 'info', logMode);
  }

  public static warn(
    data: any,
    message: string = '',
    methodType: string = 'GET',
    logMode: string = loggingMode,
  ) {
    this.createLog(data, message, methodType, 'warn', logMode);
  }

  public static success(
    data: any,
    message: string = '',
    methodType: string = 'GET',
    logMode: string = loggingMode,
  ) {
    this.createLog(data, message, methodType, 'info', logMode);
  }

  private static createLog(
    data: any,
    message: string = '',
    methodType: string,
    logType: string,
    logMode: string = loggingMode,
  ) {
    const logIsEnable = process.env.LOG_IS_ENABLE;

    if (logIsEnable)
      switch (logMode) {
        case 'CONSOLE': {
          winsConsoleLogger[logType](message, {
            methodType: methodType,
            type: logType,
            data: data,
          });
          break;
        }
        case 'FILE': {
          winsFileLogger[logType](message, {
            methodType: methodType,
            type: logType,
            data: data,
          });
          break;
        }
        case 'DB': {
          winsDBLogger[logType](message, {
            methodType: methodType,
            type: logType,
            data: data,
          });
          break;
        }

        default:
          break;
      }
  }
}
