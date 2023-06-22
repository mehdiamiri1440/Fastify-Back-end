import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { User } from '../models/User';
import { repo } from '$src/infra/utils/repo';
import permissions from '$src/permissions';
import { StringEnum } from '$src/infra/TypeboxTypes';
import { ACCESS_DENIED } from '$src/domains/user/routes/errors';
import {
  generateTokensForUser,
  getLoginAndActiveUserByRefreshToken,
  getActiveUserByEmailAndPassword,
} from '$src/domains/user/utils';

const Users = repo(User);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.route({
    method: 'POST',
    url: '/token',
    config: {
      possibleErrors: [ACCESS_DENIED],
    },
    schema: {
      description:
        'with this api you can get access token and refresh token with email and password or refresh token',
      body: Type.Union([
        Type.Object({
          grant_type: Type.Literal('password'),
          username: Type.String(),
          password: Type.String(),
        }),
        Type.Object({
          grant_type: Type.Literal('refresh_token'),
          refresh_token: Type.String(),
        }),
      ]),
      response: {
        200: Type.Object({
          access_token: Type.String(),
          refresh_token: Type.String(),
          type: Type.Literal('bearer'),
          expires_in: Type.Number(),
          scope: Type.String(),
        }),
        default: Type.Object({
          statusCode: Type.Integer(),
          code: Type.String(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
    async handler(req) {
      switch (req.body.grant_type) {
        case 'password': {
          req.body.username &&= req.body.username.toLowerCase(); // make username lowercase
          const user = await getActiveUserByEmailAndPassword(
            req.body.username,
            req.body.password,
          );

          if (!user) throw new ACCESS_DENIED();

          return await generateTokensForUser(app, user);
        }
        case 'refresh_token': {
          const user = await getLoginAndActiveUserByRefreshToken(
            app,
            req.body.refresh_token,
          );

          if (!user) throw new ACCESS_DENIED();

          return await generateTokensForUser(app, user, req.body.refresh_token);
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
