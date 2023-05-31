import {
  RolePermissionsSchema,
  RoleSchema,
} from '$src/domains/user/schemas/role.schema';
import { repo } from '$src/infra/utils/repo';
import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Role } from '../../user/models/Role';
import { RolePermission } from '../models/RolePermission';
import { DeepPartial } from 'typeorm';
import AppDataSource from '$src/DataSource';
import { RoleService } from '$src/domains/user/services/role.service';

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
      return new TableQueryBuilder(Roles, req)
        .relation(() => {
          return { creator: true };
        })
        .exec();
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
      body: Type.Pick(Type.Composite([RoleSchema, RolePermissionsSchema]), [
        'title',
        'isActive',
        'permissions',
      ]),
    },
    async handler(req) {
      return await AppDataSource.transaction(async (manager) => {
        const service = new RoleService(manager, req.user.id);

        // create role
        const { title, isActive } = req.body;
        const role = await service.createRole({ title, isActive });

        // update role permissions
        await service.updatePermissionsOfRole(role.id, req.body.permissions);

        return role;
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
      body: Type.Pick(Type.Composite([RoleSchema, RolePermissionsSchema]), [
        'title',
        'isActive',
        'permissions',
      ]),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await AppDataSource.transaction(async (manager) => {
        const service = new RoleService(manager, req.user.id);

        // update role
        const { title, isActive } = req.body;
        await service.updateRole(req.params.id, { title, isActive });

        // update role permissions
        await service.updatePermissionsOfRole(
          req.params.id,
          req.body.permissions,
        );
      });
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
      body: Type.Pick(RoleSchema, ['isActive']),
    },
    async handler(req) {
      const { id } = await Roles.findOneByOrFail({ id: req.params.id });
      const { isActive } = req.body;
      await Roles.update({ id }, { isActive });
    },
  });
  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['user@role::list'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await Roles.findOneOrFail({
        where: { id: req.params.id },
        relations: { creator: true },
      });
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
    method: 'PUT',
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
      body: RolePermissionsSchema,
    },
    async handler(req) {
      return await AppDataSource.transaction(async (manager) => {
        const service = new RoleService(manager, req.user.id);

        // update role permissions
        await service.updatePermissionsOfRole(
          req.params.id,
          req.body.permissions,
        );
      });
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
