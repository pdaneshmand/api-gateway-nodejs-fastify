import App from './init/init';
import AppHttps from './init/initHttps';
import logger from './libraries/Logger';

logger.warn({}, `Your Enviroment Mode : ${process.env.NODE_ENV}`, '', 'CONSOLE');

/**
 * Initialize Application
 * ? In this point, Based on yout HTTP_MODE from enviroment app running in HTTP or HTTPS
 */
if (process.env.HTTP_MODE === 'SECURE') new AppHttps().start();
else new App().start();
