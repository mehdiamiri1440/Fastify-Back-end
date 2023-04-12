import createError from '@fastify/error';
import assert from 'assert';
import FastifySwagger from '@fastify/swagger';
import { FastifyPluginAsync } from 'fastify/types/plugin';
import { TypeORMError } from 'typeorm';
import permissions from './permissions';

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
          OAuth2: {
            type: 'oauth2',
            flows: {
              password: {
                tokenUrl: 'http://localhost:3003/api/v1/login',
                scopes: permissions,
              },
            },
          },
        },
      },
    },
  });

  await fastify.register(import('@fastify/jwt'), {
    secret: JWT_SECRET,
  });

  await fastify.addHook('onRoute', (route) => {
    if (route.routePath !== '' && route.routePath !== '/*') {
      if (route.schema === undefined) return;
      if (route.schema.security === undefined) return;

      let scopes: string[] = [];
      for (const index in route.schema.security) {
        if (route.schema.security[index].OAuth2 !== undefined) {
          scopes = route.schema.security[index].OAuth2;
        }
      }
      if (scopes.length <= 0) return;

      // check used scopes is out of permissions or not
      for (const index in scopes) {
        if (!Object.keys(permissions).includes(scopes[index])) {
          throw new Error('you used a scope that not in permissions');
        }
      }
    }
  });

  fastify.register(import('@fastify/formbody'));

  await fastify.register(
    async () => {
      await fastify.register(import('@fastify/swagger-ui'), {
        prefix: '/docs',
        uiConfig: {
          persistAuthorization: true,
        },
      });

      await fastify.register(import('./domains/user/routes'));

      await fastify.register(import('./domains/customer/routes'));
      await fastify.register(import('./domains/supplier/routes'));
    },
    {
      prefix: '/api/v1',
    },
  );
};

export default app;
