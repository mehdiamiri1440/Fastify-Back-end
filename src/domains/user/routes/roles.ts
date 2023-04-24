import { repo } from '$src/databases/typeorm';
import { RoleSchema } from '$src/domains/user/schemas/role.schema';
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
    schema: {
      security: [
        {
          OAuth2: ['user@role::create'],
        },
      ],
      body: Type.Omit(RoleSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
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
    schema: {
      security: [
        {
          OAuth2: ['user@role::update'],
        },
      ],
      body: Type.Omit(RoleSchema, [
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
      const { id } = await Roles.findOneByOrFail({ id: req.params.id });
      await Roles.update({ id }, req.body);
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
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
      const { id } = await Roles.findOneByOrFail({ id: req.params.id });
      await Roles.delete({ id });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id/is-active',
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
      const { id } = await Roles.findOneByOrFail({ id: req.params.id });
      const { isActive } = req.body;
      await Roles.update({ id }, { isActive });
    },
  });
  app.route({
    method: 'GET',
    url: '/:id/permissions',
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
      const roleId: number = req.params.id;
      return new TableQueryBuilder(RolePermissions, req)
        .where(() => {
          return { role: { id: roleId } };
        })
        .exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/:id/permissions/:code',
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
      const roleId: number = req.params.id;
      const permission: string = req.params.code;
      const creatorId = req.user.id;
      return await RolePermissions.save({
        permission: permission,
        role: { id: roleId },
        creator: { id: creatorId },
      });
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id/permissions/:code',
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
      const { id } = await Roles.findOneByOrFail({ id: req.params.id });
      const permission: string = req.params.code;
      await RolePermissions.delete({
        permission: permission,
        role: { id },
      });
    },
  });
};

export default plugin;
