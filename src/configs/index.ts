import { FastifyInstance } from 'fastify';
import * as fp from 'fastify-plugin';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { config } from 'dotenv';

config();

export interface IConfig {
  apiurl: string;
  mongouri: string;
  apikey?: string;
  jwtsecret: string;
  appname: string;
}

const production = process.env.NODE_ENV === `Production`;

/**
 * Application Configuration
 * ? In this point, Configuration Database conenction settting, Mail settings and jwt config
 */
export const configs: IConfig = {
  apiurl: (() => {
    if (production) {
      return process.env.API_PROD_URL;
    }

    return process.env.API_DEV_URL;
  })(),
  mongouri: (() => {
    if (production)
      return process.env.MONGO_AUTH_ENABLE_PROD === 'YES'
        ? `mongodb://${process.env.MONGO_USERNAME_PROD}:${process.env.MONGO_PASSWORD_PROD}@${process.env.MONGO_HOST_PROD}:${process.env.MONGO_PORT_PROD}/${process.env.MONGO_DATABASE_PROD}`
        : `mongodb://${process.env.MONGO_HOST_PROD}:${process.env.MONGO_PORT_PROD}/${process.env.MONGO_DATABASE_PROD}`;

    return process.env.MONGO_AUTH_ENABLE_DEV === 'YES'
      ? `mongodb://${process.env.MONGO_USERNAME_DEV}:${process.env.MONGO_PASSWORD_DEV}@${process.env.MONGO_HOST_DEV}:${process.env.MONGO_PORT_DEV}/${process.env.MONGO_DATABASE_DEV}`
      : `mongodb://${process.env.MONGO_HOST_DEV}:${process.env.MONGO_PORT_DEV}/${process.env.MONGO_DATABASE_DEV}`;
  })(),
  jwtsecret: process.env.JWT_SECRET_KEY,
  appname: process.env.APPLICATION_NAME,
};

export default fp.default(
  (
    app: FastifyInstance<Server, IncomingMessage, ServerResponse>,
    opts: {},
    done: (err?: Error) => void,
  ) => {
    app.decorate(`config`, configs);
    done();
  },
);
