import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import assert from 'assert';
import { Type } from '@sinclair/typebox';
import { User } from '../models/User';
import { RolePermission } from '$src/domains/user/models/RolePermission';
import { repo } from '$src/infra/utils/repo';
import { createError } from '@fastify/error';
import permissions from '$src/permissions';
import crypto from 'crypto';

const ACCESS_DENIED = createError('ACCESS_DENIED', 'you dont have access', 403);
const Users = repo(User);
const RolePermissions = repo(RolePermission);
const { TOKEN_TTL_SECONDS } = process.env;

if (TOKEN_TTL_SECONDS) {
  assert(Number(TOKEN_TTL_SECONDS) > 0, 'Invalid TOKEN_TTL_SECONDS');
}

const TTL = TOKEN_TTL_SECONDS ? Number(TOKEN_TTL_SECONDS) : 200 * 60; // 20 mins

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'POST',
    url: '/login',
    schema: {
      body: Type.Object({
        username: Type.String(),
        password: Type.String(),
      }),
    },
    async handler(req) {
      const user = await Users.findOne({
        where: {
          email: req.body.username,
          password: crypto
            .createHash('md5')
            .update(req.body.password)
            .digest('hex'),
        },
        relations: ['role'],
      });
      if (!user) {
        return new ACCESS_DENIED();
      }
      let scope: string;
      if (user.role.title === 'root') {
        scope = Object.keys(permissions).join(' ');
      } else {
        const { id } = user.role;
        const permissions = await RolePermissions.findBy({ role: { id } });
        scope = permissions.map((p) => p.permission).join(' ');
      }
      const token = app.jwt.sign(
        {
          id: user.id,
          scope,
        },
        {
          expiresIn: TTL,
        },
      );
      return JSON.stringify({
        access_token: token,
        token_type: 'bearer',
        expires_in: TTL,
        scope,
      });
    },
  });

  await app.register(import('./users'), { prefix: '/users' });
  await app.register(import('./roles'), { prefix: '/roles' });
  app.route({
    method: 'GET',
    url: '/users/me',
    schema: {
      security: [
        {
          OAuth2: [],
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
  app.route({
    method: 'GET',
    url: '/permissions',

    async handler(req) {
      return permissions;
    },
  });
};

export default plugin;
