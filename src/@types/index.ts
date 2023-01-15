import { IncomingMessage, Server, ServerResponse } from 'http';
import { IConfig } from '../configs';
import { IUtilities } from '../utils';

interface IUserCredentials {
  id: string;
  email: string;
  roles: [];
  permissions: [];
}

declare module 'fastify' {
  export interface FastifyInstance {
    config: IConfig;
    utils: IUtilities;
  }
}
interface FastifyRequest {
  user: IUserCredentials;
}
