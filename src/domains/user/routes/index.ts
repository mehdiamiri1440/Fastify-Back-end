import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { User } from '../models/User';
import { repo } from '$src/infra/utils/repo';
import permissions from '$src/permissions';
import StringEnum from '$src/infra/utils/StringEnum';
import { ACCESS_DENIED } from '$src/domains/user/routes/errors';
import {
  GenerateTokensForUser,
  GetLoginAndActiveUserByRefreshToken,
  GetActiveUserByEmailAndPassword,
} from '$src/domains/user/utils';

const Users = repo(User);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.route({
    method: 'POST',
    url: '/token',
    schema: {
      body: Type.Object({
        grant_type: StringEnum(['password', 'refresh_token']),
        username: Type.Optional(Type.String()),
        password: Type.Optional(Type.String()),
        refresh_token: Type.Optional(Type.String()),
      }),
    },
    async handler(req) {
      switch (req.body.grant_type) {
        case 'password': {
          if (!req.body.username || !req.body.password)
            throw new ACCESS_DENIED();

          const user = await GetActiveUserByEmailAndPassword(
            req.body.username,
            req.body.password,
          );

          if (!user) throw new ACCESS_DENIED();

          return await GenerateTokensForUser(app, user);
        }
        case 'refresh_token': {
          if (!req.body.refresh_token) throw new ACCESS_DENIED();

          const user = await GetLoginAndActiveUserByRefreshToken(
            app,
            req.body.refresh_token,
          );

          if (!user) throw new ACCESS_DENIED();

          return await GenerateTokensForUser(app, user, req.body.refresh_token);
        }
      }
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
      const user = await Users.findOne({
        where: { id: req.user.id },
        relations: { role: true, creator: true },
      });

      return {
        data: user,
        meta: {},
      };
    },
  });
  app.route({
    method: 'GET',
    url: '/permissions',

    async handler(req) {
      return {
        data: permissions,
        meta: {},
      };
    },
  });
};

export default plugin;
