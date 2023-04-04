import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { usersAuth } from '$src/authentication/users';
import { Role } from '../../user/models/Role';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { RoleSchema, RoleType } from '$src/domains/user/schemas/role.schema';
import { Type } from '@sinclair/typebox';
import { RolePermission } from '../models/RolePermission';
const Roles = repo(Role);
const RolePermissions = repo(RolePermission);

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
  app.route({
    method: 'GET',
    url: '/:id/permissions',
    onRequest: usersAuth,
    schema: {
      tags: ['roles'],
      security: [
        {
          Bearer: [],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
      querystring: ListQueryOptions({
        filterable: ['permission'],
        orderable: ['permission'],
        searchable: ['permission'],
      }),
    },
    async handler(req) {
      const role_id: number = req.params.id;
      return new TableQueryBuilder(RolePermissions, req)
        .where(() => {
          return { role: { id: role_id } };
        })
        .exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/:id/permissions/:code',
    onRequest: usersAuth,
    schema: {
      tags: ['roles'],
      security: [
        {
          Bearer: [],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
        code: Type.String(),
      }),
    },
    async handler(req) {
      const role_id: number = req.params.id;
      const permission: string = req.params.code;
      return await RolePermissions.save({
        permission: permission,
        role: { id: role_id },
      });
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id/permissions/:code',
    onRequest: usersAuth,
    schema: {
      tags: ['roles'],
      security: [
        {
          Bearer: [],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
        code: Type.String(),
      }),
    },
    async handler(req) {
      const role_id: number = req.params.id;
      const permission: string = req.params.code;
      return await RolePermissions.delete({
        permission: permission,
        role: { id: role_id },
      });
    },
  });
};

export default plugin;
