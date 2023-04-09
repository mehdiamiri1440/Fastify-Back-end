import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { usersAuth } from '$src/authentication/users';
import { Role } from '../../user/models/Role';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import {
  InputRoleSchema,
  InputRoleType,
} from '$src/domains/user/schemas/role.schema';
import { Type } from '@sinclair/typebox';
import { RolePermission } from '../models/RolePermission';
const Roles = repo(Role);
const RolePermissions = repo(RolePermission);
import isPermissionInPermissions from '$src/infra/authorize';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    onRequest: usersAuth,
    schema: {
      tags: ['roles'],
      security: [
        {
          Bearer: [],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['title'],
        orderable: ['title'],
        searchable: ['title'],
      }),
    },
    async handler(req) {
      if (!(await isPermissionInPermissions('read', req.user.scope)))
        return 'error';
      return new TableQueryBuilder(Roles, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    onRequest: usersAuth,
    schema: {
      tags: ['roles'],
      security: [
        {
          Bearer: [],
        },
      ],
      body: InputRoleSchema,
    },
    async handler(req) {
      return await Roles.save({
        ...(req.body as InputRoleType),
        creator: { id: req.user.id },
      });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    onRequest: usersAuth,
    schema: {
      tags: ['roles'],
      security: [
        {
          Bearer: [],
        },
      ],
      body: InputRoleSchema,
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await Roles.update(
        { id: req.params.id },
        req.body as InputRoleType,
      );
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
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
    },
    async handler(req) {
      return await Roles.delete({ id: req.params.id });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id/is-active',
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
      body: Type.Object({
        isActive: Type.Boolean(),
      }),
    },
    async handler(req) {
      const { id } = req.params;
      const { isActive } = req.body;
      return await Roles.update({ id }, { isActive });
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
      const creator_id = req.user.id;
      return await RolePermissions.save({
        permission: permission,
        role: { id: role_id },
        creator: { id: creator_id },
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
