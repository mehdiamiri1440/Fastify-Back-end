import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { usersAuth } from '$src/authentication/users';
import { User } from '../../user/models/User';
import { Role } from '../../user/models/Role';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { InputUserSchema } from '$src/domains/user/schemas/user.schema';
import { Type } from '@sinclair/typebox';
import { createError } from '@fastify/error';

const Users = repo(User);
const Roles = repo(Role);
const REFERENCE_NOT_FOUND = createError(
  'REFERENCE_NOT_FOUND',
  'reference not found',
  404,
);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    onRequest: [usersAuth],
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
    onRequest: [usersAuth],
    schema: {
      security: [
        {
          OAuth2: ['user@role::create'],
        },
      ],
      body: InputUserSchema,
    },
    async handler(req) {
      // validating role
      const role = await Roles.findOneBy({ id: req.body.role });
      if (!role) throw REFERENCE_NOT_FOUND();

      return await Users.save({
        ...req.body,
        role,
        creator: { id: req.user.id },
      });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    onRequest: [usersAuth],
    schema: {
      security: [
        {
          OAuth2: ['user@user::update'],
        },
      ],
      body: InputUserSchema,
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      // validating role
      const role = await Roles.findOneBy({ id: req.body.role });
      if (!role) throw REFERENCE_NOT_FOUND();

      return await Users.update({ id: req.params.id }, { ...req.body, role });
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    onRequest: [usersAuth],
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
      return await Users.delete({ id: req.params.id });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id/is-active',
    onRequest: [usersAuth],
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
      const { id } = req.params;
      const { isActive } = req.body;
      return await Users.update({ id }, { isActive });
    },
  });
};

export default plugin;
