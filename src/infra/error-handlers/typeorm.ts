import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';
import { QueryFailedError, TypeORMError } from 'typeorm';

const ENTITY_NOT_FOUND = createError(
  'ENTITY_NOT_FOUND',
  'Entity not found',
  404,
);

const ALREADY_EXISTS = createError('ALREADY_EXISTS', 'ALREADY_EXISTS', 400);

const plugin: FastifyPluginAsyncTypebox = async function (fastify) {
  const defaultErrorHandler = fastify.errorHandler;
  fastify.setErrorHandler((error, request, reply) => {
    // handle typeorm
    if (error instanceof TypeORMError) {
      // not found error
      if (error.message.includes('Could not find any entity')) {
        const fastifyError = new ENTITY_NOT_FOUND();
        fastifyError.cause = error;
        // replace new line and white space
        // also replace quotes
        fastifyError.message = error.message
          .replace(/(\r\n|\n|\r|\s+)/gm, ' ')
          .replaceAll('  ', ' ')
          .replace(/"/g, "'");
        return defaultErrorHandler(fastifyError, request, reply);
      } else if (
        // duplicate key error
        error instanceof QueryFailedError &&
        error.message.includes('duplicate key value violates unique constraint')
      ) {
        const fastifyError = new ALREADY_EXISTS();
        fastifyError.cause = error;
        const betterDetail = error.driverError.detail
          .replaceAll('=', ' with value ')
          .replaceAll('(', '')
          .replaceAll(')', '');
        fastifyError.message = betterDetail;
        return defaultErrorHandler(fastifyError, request, reply);
      }
    }

    return defaultErrorHandler(error, request, reply);
  });
};

export default fp(plugin);
