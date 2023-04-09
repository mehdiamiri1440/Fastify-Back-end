import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { usersAuth } from '$src/authentication/users';
import { User } from '../../user/models/User';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import {
  InputUserSchema,
  InputUserType,
} from '$src/domains/user/schemas/user.schema';
const Users = repo(User);
import { Type } from '@sinclair/typebox';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    onRequest: usersAuth,
    schema: {
      tags: ['users'],
      security: [
        {
          Bearer: [],
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
    onRequest: usersAuth,
    schema: {
      tags: ['users'],
      security: [
        {
          Bearer: [],
        },
      ],
      body: InputUserSchema,
    },
    async handler(req) {
      return await Users.save({
        ...(req.body as InputUserType),
        creator: { id: req.user.id },
      });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    onRequest: usersAuth,
    schema: {
      tags: ['users'],
      security: [
        {
          Bearer: [],
        },
      ],
      body: InputUserSchema,
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await Users.update(
        { id: req.params.id },
        req.body as InputUserType,
      );
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    onRequest: usersAuth,
    schema: {
      tags: ['users'],
      security: [
        {
          Bearer: [],
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
    onRequest: usersAuth,
    schema: {
      tags: ['users'],
      security: [
        {
          Bearer: [],
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
