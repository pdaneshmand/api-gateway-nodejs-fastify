import ProxySecureMiddleWare from '../proxy/proxySecure';
import CustomSecureHooks from '../configs/secureHooks';
import CustomSecurePlugins from '../configs/securePlugins';
import * as fastify from 'fastify';
import cluster from 'cluster';
import * as os from 'os';
import { join } from 'path';
import logger from '../libraries/Logger';
import {
  Http2SecureServer,
  Http2ServerRequest,
  Http2ServerResponse,
} from 'http2';
import { setMetricsRoutes } from '../libraries/monitor';

const settings = require(join(__dirname, '..', '..', 'settings.json'));
const fs = require('fs');
const path = require('path');

export default class InitHttps {

  public appHttps: fastify.FastifyInstance<
    Http2SecureServer,
    Http2ServerRequest,
    Http2ServerResponse
  >;
  private port: any;

  constructor() {

    this.port = parseInt(process.env.PORT);
    this.appHttps = fastify.fastify({
      http2: true,
      https: {
        allowHTTP1: true,
        key: fs.readFileSync(path.join(path.resolve('./certs/key.pem'))),
        cert: fs.readFileSync(path.join(path.resolve('./certs/cert.pem'))),
      },
      caseSensitive: false,
      ignoreTrailingSlash: true,
      logger: {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          }},
        serializers: {
          res(reply) {
            // The default
            return {
              statusCode: reply.statusCode,
            };
          },
          req(request) {
            return {
              method: request.method,
              url: request.url,
              path: request.url,
              parameters: request.routerPath,
              // Including the headers in the log could be in violation
              // of privacy laws, e.g. GDPR. You should use the "redact" option to
              // remove sensitive fields. It could also leak authentication data in
              // the logs.
              headers: request.headers,
            };
          },
        },
      },
    });
    this.config();
  }

  public async start() {
    settings.scale && cluster.isPrimary
      ? await this.workerProcesses()
      : await this.startListening();

    logger.success(
      {},
      'Server listening on port' +
        ' ' +
        JSON.stringify(this.appHttps.server.address()),
      '',
      'CONSOLE',
    );
  }

  private async startListening() {
    return await this.appHttps
      .listen({ port: this.port, host: '0.0.0.0' })
      .catch((error) => {
        logger.error(error, error.message, '', 'CONSOLE');
      });
  }

  private config() {
    this.errorHandler();
    setMetricsRoutes(this.appHttps as any)
    new CustomSecurePlugins(this.appHttps);
    new ProxySecureMiddleWare(this.appHttps);
    new CustomSecureHooks(this.appHttps);
  }

  private errorHandler(){
    process.on('uncaughtException', (error) => {
      logger.error(error, error.message, '', 'CONSOLE');
    });
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(
        {},
        'Unhandled Rejection at:' +
          ' ' +
          JSON.stringify(promise) +
          ' ' +
          'reason:' +
          JSON.stringify(promise),
        '',
        'CONSOLE',
      );
    });

    this.appHttps.setErrorHandler(async (error, request, reply) => {
      // logger.error(request, 'Request Information :', '', 'CONSOLE');
      // logger.error(reply, 'Request Response :', '', 'CONSOLE');
      logger.error(error, 'Request Error :', '', 'CONSOLE');
      return reply.code(error.statusCode).type('application/json').send(error);
    });
  }

  private async workerProcesses() {
    const cpus = os.cpus();

    for (const _cpu in cpus) {
      cluster.fork();
    }

    cluster.on('exit', async (_worker) => {
      cluster.fork();
    });
  }
}
