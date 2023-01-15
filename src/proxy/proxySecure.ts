import * as fastify from 'fastify';
import {
  Http2SecureServer,
  Http2ServerRequest,
  Http2ServerResponse,
} from 'http2';
const https = require('https');
const hyperid = require('hyperid');
const proxy = require('@fastify/http-proxy');
const uuid = hyperid();

export default class ProxySecureMiddleWare {
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

    this.appHttps.register(require('fastify-reply-from'), {
      base: 'https://127.0.0.1:8001/',
      http: {
        agents: {
          'http:': new https.Agent({ keepAliveMsecs: 10 * 60 * 1000 }), // pass in any options from https://nodejs.org/api/http.html#http_new_agent_options
        },
        requestOptions: {
          // pass in any options from https://nodejs.org/api/http.html#http_http_request_options_callback
          timeout: 5000, // timeout in msecs, defaults to 10000 (10 seconds)
        },
      },
    });

    /** Calling Backend-Service Auth*/
    this.appHttps.register(proxy, {
      upstream: 'http://127.0.0.1:9001/auth/',
      prefix: '/auth/', // optional
      replyOptions: {
        rewriteRequestHeaders: (originalReq, headers) => ({
          ...headers,
          'request-id': uuid(),
        }),
      },
      http2: false, // optional,
    });

    /** Calling Backend-Service User*/
    this.appHttps.register(proxy, {
      upstream: 'http://127.0.0.1:9001/',
      prefix: '/user/', // optional
      replyOptions: {
        rewriteRequestHeaders: (originalReq, headers) => ({
          ...headers,
          'request-id': uuid(),
        }),
      },
      http2: false, // optional,
    });

    //You can register other services here
  }
}
