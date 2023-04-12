import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { usersAuth } from '$src/authentication/users';
import { User } from '../../user/models/User';
import { Role } from '../../user/models/Role';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import {
  InputUserSchema,
  InputUserType,
} from '$src/domains/user/schemas/user.schema';
const Users = repo(User);
const Roles = repo(Role);
import { Type } from '@sinclair/typebox';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    onRequest: [usersAuth],
    schema: {
      tags: ['users'],
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
      tags: ['users'],
      security: [
        {
          OAuth2: ['user@role::update'],
        },
      ],
      body: InputUserSchema,
    },
    async handler(req) {
      // validating role
      const role = await Roles.findOneBy({ id: req.body.role });
      if (!role) return 'error';

      const { ...rest } = req.body;

      return await Users.save({
        ...rest,
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
      tags: ['users'],
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
      const role_ = await Roles.findOneBy({ id: req.body.role });
      if (!role_) return 'error';

      return await Users.update(
        { id: req.params.id },
        req.body as InputUserType,
      );
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    onRequest: [usersAuth],
    schema: {
      tags: ['users'],
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
      tags: ['users'],
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
