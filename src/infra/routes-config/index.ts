import { FastifyErrorConstructor } from '@fastify/error';

declare module 'fastify' {
  export interface FastifyContextConfig {
    possibleErrors: FastifyErrorConstructor[];
  }
}
