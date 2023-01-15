import * as fastify from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
const http = require('http');
const hyperid = require('hyperid');
const proxy = require('@fastify/http-proxy');
const uuid = hyperid();

export default class ProxyMiddleWare {
  public app: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>;

  constructor(
    apps: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>,
  ) {
    this.app = apps;

    this.app.register(require('fastify-reply-from'), {
      base: 'http://127.0.0.1:8001/',
      http: {
        agents: {
          'http:': new http.Agent({ keepAliveMsecs: 10 * 60 * 1000 }), // pass in any options from https://nodejs.org/api/http.html#http_new_agent_options
        },
        requestOptions: {
          // pass in any options from https://nodejs.org/api/http.html#http_http_request_options_callback
          timeout: 5000, // timeout in msecs, defaults to 10000 (10 seconds)
        },
      },
    });

    /** Calling Backend-Service Auth*/
    this.app.register(proxy, {
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
    this.app.register(proxy, {
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
