import createError from '@fastify/error';
import assert from 'assert';
import FastifySwagger from '@fastify/swagger';
import { FastifyPluginAsync } from 'fastify/types/plugin';
import { TypeORMError } from 'typeorm';

const ENTITY_NOT_FOUND = createError(
  'ENTITY_NOT_FOUND',
  'Entity not found',
  404,
);

const app: FastifyPluginAsync = async (fastify) => {
  const { JWT_SECRET } = process.env;
  assert(JWT_SECRET, 'JWT_SECRET env var not provided');

  const defaultErrorHandler = fastify.errorHandler;
  fastify.setErrorHandler((error, request, reply) => {
    // handle typeorm not found error
    if (error instanceof TypeORMError) {
      const fastifyError = new ENTITY_NOT_FOUND();
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

  await fastify.register(import('./databases/typeorm'));

  await fastify.register(FastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      components: {
        securitySchemes: {
          Bearer: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
    },
  });

  await fastify.register(import('@fastify/jwt'), {
    secret: JWT_SECRET,
  });

  await fastify.register(
    async () => {
      await fastify.register(import('@fastify/swagger-ui'), {
        prefix: '/docs',
        uiConfig: {
          persistAuthorization: true,
        },
      });

      await fastify.register(import('./domains/user/routes'), {
        prefix: '/users',
      });

      await fastify.register(import('./domains/customer/routes'), {
        prefix: '/customers',
      });
    },
    {
      prefix: '/api/v1',
    },
  );
};

export default app;
