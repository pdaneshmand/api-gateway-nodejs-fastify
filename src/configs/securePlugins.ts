import * as fastify from 'fastify';
import {
  Http2SecureServer,
  Http2ServerRequest,
  Http2ServerResponse,
} from 'http2';
import fastifyCompress from '@fastify/compress';
import fastifyRedis from '@fastify/redis';
import fastifyCaching from '@fastify/caching';
const zlib = require('zlib');
import logger from '../libraries/Logger';
import * as cors from '@fastify/cors';
import config from '../configs';
import utilities from '../utils';

export default class CustomSecurePlugins {
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

    this.appHttps.register(fastifyCaching, {
      privacy: 'public',
      expiresIn: 300,
    });

    this.appHttps.register(fastifyCompress, {
      brotliOptions: {
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT, // useful for APIs that primarily return text
          [zlib.constants.BROTLI_PARAM_QUALITY]: 4, // default is 11, max is 11, min is 0
        },
      },
      zlibOptions: {
        level: 9, // default is typically 6, max is 9, min is 0
      },
    });

    this.appHttps.register(cors.default, {
      preflight: true,
      credentials: true,
    });
    this.appHttps.register(config);
    this.appHttps.register(utilities);
    /**
     * API calling rate limit config
     * ? In this point, You can config api lock for how many times calling in 1 minute
     */
    this.appHttps.register(require('@fastify/rate-limit'), {
      global: true, // default true
      max: 1000, // default 1000
      ban: 500, // default null
      timeWindow: 60000, // default 1000 * 60
      cache: 10000, // default 5000
      // allowList: ['127.0.0.1'], // default []
      // redis: new Redis({ host: '127.0.0.1' }), // default null
      skipOnError: false, // default false
      //keyGenerator: function(req) { /* ... */ }, // default (req) => req.raw.ip
      errorResponseBuilder: function (request, context) {
        logger.error(
          {},
          `API too many request error : ${context.max} requests per ${context.after} to this Website. Try again soon.Request Info : ${request.ip}}`,
        );
        return {
          code: 429,
          error: `Too Many Requests, We only allow ${context.max} requests per ${context.after} to this Website. Try again soon.`,
          message: 'nok',
          data: `We only allow ${context.max} requests per ${context.after} to this Website. Try again soon.`,
          date: Date.now(),
          expiresIn: context.ttl, // milliseconds
        };
      },
      enableDraftSpec: true, // default false. Uses IEFT draft header standard
      addHeadersOnExceeding: {
        // default show all the response headers when rate limit is not reached
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
      },
      addHeaders: {
        // default show all the response headers when rate limit is reached
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true,
      },
    });
  }
}
