import * as fastify from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import logger from '../libraries/Logger';
import { monitor } from '../utils/monitoring/monitoring';
const append = require('vary').append;

export default class CustomHooks {
  public app: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>;

  constructor(
    apps: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>,
  ) {
    this.app = apps;

    /**
     * Logging data when app has errors
     */
    this.app.addHook('onError', (request, reply, error, next) => {
      // logger.error(request, 'Request Information :', '', 'CONSOLE');
      // logger.error(reply, 'Request Response :', '', 'CONSOLE');
      logger.error(error, 'Request Error :', '', 'CONSOLE');
      next();
    });

    /**
     * Handle on request
     */
    this.app.addHook('onRequest', (request, reply, next) => {
      // if (process.env.MONITORING_ENABLED === 'YES')
      // monitor(request as any, reply as any);
      if (process.env.LOG_HTTP_ENABLE === 'YES')
        logger.info(request, request.ip, request.method);
      // remove trailing slash
      if (request.url.endsWith('/') && request.url !== '/') {
        reply.raw.writeHead(301, {
          Location:
            'http://' + request.headers['host'] + request.url.slice(0, -1),
        });
        reply.raw.end();
      }

      next();
    });

    this.app.addHook('onResponse', (request, reply, next) => {
      if (process.env.LOG_HTTP_ENABLE === 'YES')
        logger.info(reply, request.ip, request.method);
      next();
    });

    this.app.addHook('onTimeout', (request, reply, next) => {
      if (process.env.LOG_HTTP_ENABLE === 'YES')
        logger.info(request, request.ip, request.method);
      next();
    });

    //this.app.decorateRequest('user', () => {});

    this.app.addHook('onSend', async (req, reply) => {
      if (req.headers['accept-version']) {
        // or the custom header you are using
        let value = reply.getHeader('Vary') || '';
        const header = Array.isArray(value) ? value.join(', ') : String(value);
        if ((value = append(header, 'Accept-Version'))) {
          // or the custom header you are using
          reply.header('Vary', value + ' ' + process.env.API_VERSION);
        }
      }
    });

    /**
     * Pre handler
     * ? Pre handle means, checking JWT authorization status
     */
    this.app.addHook('preHandler', (req, res, next: (err?: Error) => void) => {
      const auth = req.headers['authorization'] as string;

      try {
        const token = auth.split(' ')[1];

        req['user'] = this.app.utils.verify(token);
        logger.warn('User Infoamtion : ', req['user'], '', 'CONSOLE');
      } catch (error) {}

      next();
    });
  }
}
