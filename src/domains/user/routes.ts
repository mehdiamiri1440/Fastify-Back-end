import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import assert from 'assert';
import { usersAuth } from '$src/authentication/users';
import { Type } from '@sinclair/typebox';
import { User } from '../user/models/User';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
const Users = repo(User);

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
  
};

export default plugin;
