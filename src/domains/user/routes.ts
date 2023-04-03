import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import assert from 'assert';

const { TOKEN_TTL_SECONDS } = process.env;

if (TOKEN_TTL_SECONDS) {
  assert(Number(TOKEN_TTL_SECONDS) > 0, 'Invalid TOKEN_TTL_SECONDS');
}

const TTL = TOKEN_TTL_SECONDS ? Number(TOKEN_TTL_SECONDS) : 20 * 60; // 20 mins

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'POST',
    url: '/login',
    schema: {
      tags: ['Auth'],
    },
    async handler() {
      const token = app.jwt.sign(
        {
          id: 1,
        },
        {
          expiresIn: TTL,
        },
      );

      return { token };
    },
  });

  app.register(import('./routes/users'), { prefix: '/users' });
  app.register(import('./routes/roles'), { prefix: '/roles' });
};

export default plugin;
