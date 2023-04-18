import { usersAuth } from '$src/authentication/users';
import { repo } from '$src/databases/typeorm';
import { InputRoleSchema } from '$src/domains/user/schemas/role.schema';
import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Role } from '../../user/models/Role';
import { RolePermission } from '../models/RolePermission';

const Roles = repo(Role);
const RolePermissions = repo(RolePermission);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    onRequest: [usersAuth],
    schema: {
      security: [
        {
          OAuth2: ['user@role::list'],
        },
      ],
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
    onRequest: [usersAuth],
    schema: {
      security: [
        {
          OAuth2: ['user@role::create'],
        },
      ],
      body: InputRoleSchema,
    },
    async handler(req) {
      return await Roles.save({
        ...req.body,
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
          OAuth2: ['user@role::update'],
        },
      ],
      body: InputRoleSchema,
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await Roles.update({ id: req.params.id }, req.body);
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    onRequest: [usersAuth],
    schema: {
      security: [
        {
          OAuth2: ['user@role::delete'],
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
    onRequest: [usersAuth],
    schema: {
      security: [
        {
          OAuth2: ['user@role::active'],
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
    onRequest: [usersAuth],
    schema: {
      security: [
        {
          OAuth2: ['user@role::list'],
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
    onRequest: [usersAuth],
    schema: {
      security: [
        {
          OAuth2: ['user@user::create'],
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
    onRequest: [usersAuth],
    schema: {
      security: [
        {
          OAuth2: ['user@role::update'],
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
