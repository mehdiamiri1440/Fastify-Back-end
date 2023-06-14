import FastifySwagger from '@fastify/swagger';
import assert from 'assert';
import { FastifyPluginAsync } from 'fastify/types/plugin';
import { SwaggerTheme } from 'swagger-themes';
import permissions from './permissions';
import { join } from 'path';
import { readFileSync } from 'fs';

export interface Options {
  /**
   * the url of the app.
   * @example 'http://my.host.com:3000'
   */
  url: string;

  appVersion: string;
}

const app: FastifyPluginAsync<Options> = async (
  fastify,
  { url, appVersion },
) => {
  const { JWT_SECRET, SWAGGER_UI_VALIDATOR_URL } = process.env;
  assert(JWT_SECRET, 'JWT_SECRET env var not provided');

  await fastify.register(import('./databases/typeorm'));
  await fastify.register(import('./infra/error-handlers/typeorm'));

  await fastify.register(import('@fastify/cors'), {
    origin: '*',
    optionsSuccessStatus: 200,
    maxAge: 3600, // cache for 1 hour
    exposedHeaders: ['Content-Disposition'],
  });

  await fastify.register(FastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      servers: [
        {
          url: `${url}/api/v1`,
        },
      ],
      components: {
        securitySchemes: {
          OAuth2: {
            type: 'oauth2',
            flows: {
              password: {
                tokenUrl: '/api/v1/token',
                refreshUrl: '/api/v1/token',
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

  await fastify.register(import('$src/infra/authorization'));
  await fastify.register(import('$src/infra/RouteValidator'));

  await fastify.register(import('$src/infra/autoTag'));

  fastify.register(import('@fastify/formbody'));

  await fastify.register(
    async (fastify) => {
      await fastify.register(import('@fastify/swagger-ui'), {
        prefix: '/docs',
        uiConfig: {
          persistAuthorization: true,
          docExpansion: 'none',
          validatorUrl: SWAGGER_UI_VALIDATOR_URL || null,
        },
        theme: {
          title: `Inventory API v${appVersion}`,
          css: [
            {
              filename: 'theme.css',
              content: new SwaggerTheme('v3').getBuffer('dark'),
            },
            {
              filename: 'custom.css',
              content: readFileSync(
                join(__dirname, 'infra/swagger.css'),
                'utf8',
              ),
            },
          ],
        },
      });

      await fastify.register(import('./infra/health'), {
        appVersion,
      });

      await fastify.register(import('./domains/user/routes'));

      await fastify.register(import('./domains/customer/routes'));
      await fastify.register(import('./domains/hub-customers/routes'));

      await fastify.register(import('./domains/configuration/routes'));

      await fastify.register(import('./domains/importer/routes'));

      await fastify.register(import('./domains/geo/routes'), {
        prefix: '/geo',
      });

      await fastify.register(import('./domains/document/routes'), {
        prefix: '/documents',
      });

      await fastify.register(import('./domains/inbound/routes'));
      await fastify.register(import('./domains/outbound/routes'));

      await fastify.register(import('./domains/files/routes'), {
        prefix: '/files',
      });

      await fastify.register(import('./domains/warehouse/routes'));
      await fastify.register(import('./domains/supplier/routes'));
      await fastify.register(import('./domains/product/routes'));
      await fastify.register(import('./domains/support/routes'));
      await fastify.register(import('./domains/iban/routes'));
      await fastify.register(import('./domains/cyclecount/routes'));
      await fastify.register(import('./domains/notification/routes'));
    },
    {
      prefix: '/api/v1',
    },
  );
};

export default app;
