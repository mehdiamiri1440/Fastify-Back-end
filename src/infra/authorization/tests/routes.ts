import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/needTokenAndPermission',
    schema: {
      security: [
        {
          OAuth2: ['user@user::list'],
        },
      ],
    },
    async handler(req) {
      return { test: 'passed' };
    },
  });
  app.route({
    method: 'GET',
    url: '/needToken',
    onRequest: [
      (request, reply, done) => {
        // do nothing
        done();
      },
    ],
    schema: {
      security: [
        {
          OAuth2: [],
        },
      ],
    },
    async handler(req) {
      return { test: 'passed' };
    },
  });
  app.route({
    method: 'GET',
    url: '/needNothing',
    async handler(req) {
      return { test: 'passed' };
    },
  });
};

export default plugin;
