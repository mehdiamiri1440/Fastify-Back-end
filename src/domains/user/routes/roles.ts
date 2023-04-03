import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { usersAuth } from '$src/authentication/users';
import { Role } from '../../user/models/Role';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { RoleSchema, RoleType } from '$src/domains/user/schemas/role.schema';
import { Type } from '@sinclair/typebox';
const Roles = repo(Role);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    onRequest: usersAuth,
    schema: {
      tags: ['roles'],
      querystring: ListQueryOptions({
        filterable: ['title'],
        orderable: ['title'],
        searchable: ['title'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Roles, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    onRequest: usersAuth,
    schema: {
      tags: ['roles'],
      body: RoleSchema,
    },
    async handler(req) {
      return await Roles.save(req.body as RoleType);
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    onRequest: usersAuth,
    schema: {
      tags: ['roles'],
      body: RoleSchema,
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await Roles.update({ id: req.params.id }, req.body as RoleType);
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    onRequest: usersAuth,
    schema: {
      tags: ['roles'],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await Roles.delete({ id: req.params.id });
    },
  });
};

export default plugin;
