import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import assert from 'assert';
import { Type } from '@sinclair/typebox';
import { User } from './models/User';
import { RolePermission } from '$src/domains/user/models/RolePermission';
import { repo } from '$src/databases/typeorm';
import { usersAuth } from '$src/authentication/users';

const Users = repo(User);
const RolePermissions = repo(RolePermission);
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
      body: Type.Object({
        email: Type.String(),
        password: Type.String(),
      }),
    },
    async handler(req) {
      const user = await Users.findOne({
        where: { email: req.body.email, password: req.body.password },
        relations: ['role'],
      });
      if (!user) {
        return 'error';
      }
      const { id } = user.role;
      const permissions = await RolePermissions.findBy({ role: { id } });
      const permission_codes: string[] = [];
      for (const index in permissions) {
        permission_codes[parseInt(index)] = permissions[index].permission;
      }
      const token = app.jwt.sign(
        {
          id: user.id,
          scope: permission_codes.join(' '),
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
  app.route({
    method: 'GET',
    url: '/users/me',
    onRequest: usersAuth,
    schema: {
      tags: ['Auth'],
      security: [
        {
          Bearer: [],
        },
      ],
    },
    async handler(req) {
      return await Users.findOne({
        where: { id: req.user.id },
        loadRelationIds: true,
      });
    },
  });
};

export default plugin;
