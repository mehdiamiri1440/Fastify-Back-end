import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { User } from '../../user/models/User';
import { Role } from '../../user/models/Role';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { UserSchema } from '$src/domains/user/schemas/user.schema';
import { Type } from '@sinclair/typebox';
import { createError } from '@fastify/error';
import crypto from 'crypto';

const Users = repo(User);
const Roles = repo(Role);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['user@user::list'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['firstName', 'lastName', 'nif', 'email', 'phoneNumber'],
        orderable: ['firstName', 'lastName', 'nif', 'email', 'phoneNumber'],
        searchable: ['firstName', 'lastName', 'nif', 'email', 'phoneNumber'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Users, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['user@role::create'],
        },
      ],
      body: Type.Omit(UserSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      // validating role
      const role = await Roles.findOneByOrFail({ id: req.body.role });

      return await Users.save({
        ...req.body,
        role,
        password: crypto
          .createHash('md5')
          .update(req.body.password)
          .digest('hex'),
        creator: { id: req.user.id },
      });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['user@user::update'],
        },
      ],
      body: Type.Omit(UserSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      // validating role
      const role = await Roles.findOneByOrFail({ id: req.body.role });

      const { id } = await Users.findOneByOrFail({ id: req.params.id });
      await Users.update(
        { id },
        {
          ...req.body,
          role,
          password: crypto
            .createHash('md5')
            .update(req.body.password)
            .digest('hex'),
        },
      );
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['user@user::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await Users.findOneByOrFail({ id: req.params.id });
      await Users.delete({ id });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id/is-active',
    schema: {
      security: [
        {
          OAuth2: ['user@user::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        isActive: Type.Boolean(),
      }),
    },
    async handler(req) {
      const { id } = await Users.findOneByOrFail({ id: req.params.id });
      const { isActive } = req.body;
      await Users.update({ id }, { isActive });
    },
  });
};

export default plugin;
