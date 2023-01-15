import { monitor } from '../utils/monitoring/monitoring';
import * as fastify from 'fastify';
import {
  Http2SecureServer,
  Http2ServerRequest,
  Http2ServerResponse,
} from 'http2';
import logger from '../libraries/Logger';
const append = require('vary').append;

export default class CustomSecureHooks {
  public appHttps: fastify.FastifyInstance<
    Http2SecureServer,
    Http2ServerRequest,
    Http2ServerResponse
  >;

  constructor(
    apps: fastify.FastifyInstance<
      Http2SecureServer,
      Http2ServerRequest,
      Http2ServerResponse
    >,
  ) {
    this.appHttps = apps;

    /**
     * Logging data when app has errors
     */
    this.appHttps.addHook('onError', (request, reply, error, next) => {
      logger.error(request, 'Request Information :', '', 'CONSOLE');
      logger.error(reply, 'Request Response :', '', 'CONSOLE');
      logger.error(error, 'Request Error :', '', 'CONSOLE');
      next();
    });

    this.appHttps.addHook('onRequest', (request, reply, next) => {
      if (process.env.MONITORING_ENABLED === 'YES')
        monitor(request as any, reply as any);
      if (process.env.LOG_HTTP_ENABLE === 'YES')
        logger.info(request, request.method);
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

    this.appHttps.addHook('onResponse', (request, reply, next) => {
      if (process.env.LOG_HTTP_ENABLE === 'YES')
        logger.info(request, request.ip, request.method);
      next();
    });

    this.appHttps.addHook('onTimeout', (request, reply, next) => {
      if (process.env.LOG_HTTP_ENABLE === 'YES')
        logger.info(reply, request.ip, request.method);
      next();
    });

    //this.appHttps.decorateRequest('user', () => {});

    this.appHttps.addHook('onSend', async (req, reply) => {
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
    this.appHttps.addHook(
      'preHandler',
      (req, res, next: (err?: Error) => void) => {
        const auth = req.headers['authorization'] as string;

        try {
          const token = auth.split(' ')[1];

          req['user'] = this.appHttps.utils.verify(token);
          logger.warn('User Infoamtion : ', req['user'], '', 'CONSOLE');
        } catch (error) {}

        next();
      },
    );
  }
}
