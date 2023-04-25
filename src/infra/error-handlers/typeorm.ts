import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';
import { TypeORMError } from 'typeorm';

const ENTITY_NOT_FOUND = createError(
  'ENTITY_NOT_FOUND',
  'Entity not found',
  404,
);

const plugin: FastifyPluginAsyncTypebox = async function (fastify) {
  const defaultErrorHandler = fastify.errorHandler;
  fastify.setErrorHandler((error, request, reply) => {
    // handle typeorm not found error
    if (error instanceof TypeORMError) {
      const fastifyError = new ENTITY_NOT_FOUND();
      fastifyError.cause = error;
      // replace new line and white space
      // also replace quotes
      fastifyError.message = error.message
        .replace(/(\r\n|\n|\r|\s+)/gm, ' ')
        .replaceAll('  ', ' ')
        .replace(/"/g, "'");
      return defaultErrorHandler(fastifyError, request, reply);
    }

    return defaultErrorHandler(error, request, reply);
  });
};

export default fp(plugin);
