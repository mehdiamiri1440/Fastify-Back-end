import AppDataSource from '$src/DataSource';
import {
  RolePermissionsSchema,
  RoleSchema,
} from '$src/domains/user/schemas/role.schema';
import { RoleService } from '$src/domains/user/services/role.service';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Role } from '../../user/models/Role';
import { RolePermission } from '../models/RolePermission';
import systemPermissions from '$src/permissions';
import { INVALID_PERMISSION } from '$src/domains/user/errors';

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
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt', 'title']),
        filter: Filter({
          title: Searchable(),
        }),
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Roles, req)
        .relation({ creator: true })
        .exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    config: { possibleErrors: [INVALID_PERMISSION] },
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
        if (req.body.permissions) {
          await service.updatePermissionsOfRole(role.id, req.body.permissions);
        }

        return role;
      });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    config: { possibleErrors: [INVALID_PERMISSION] },
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
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      return await AppDataSource.transaction(async (manager) => {
        const service = new RoleService(manager, req.user.id);

        // update role
        const { title, isActive } = req.body;
        await service.updateRole(req.params.id, { title, isActive });

        // update role permissions
        if (req.body.permissions) {
          await service.updatePermissionsOfRole(
            req.params.id,
            req.body.permissions,
          );
        }
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
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const role = await Roles.findOneByOrFail({ id: req.params.id });
      await Roles.softRemove(role);
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
        id: Type.Integer(),
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
        id: Type.Integer(),
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
        id: Type.Integer(),
      }),
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt', 'permission']),
        filter: Filter({
          permission: Searchable(),
        }),
      }),
    },
    async handler(req) {
      const roleId: number = req.params.id;
      return new TableQueryBuilder(RolePermissions, req)
        .where({ role: { id: roleId } })
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
        id: Type.Integer(),
      }),
      body: Type.Required(RolePermissionsSchema),
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
    config: { possibleErrors: [INVALID_PERMISSION] },
    schema: {
      security: [
        {
          OAuth2: ['user@user::create'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
        code: Type.String(),
      }),
    },
    async handler(req) {
      const roleId: number = req.params.id;
      const permission: string = req.params.code;
      const creatorId = req.user.id;
      if (!(permission in systemPermissions)) throw new INVALID_PERMISSION(); // check if we have this permission or not
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
        id: Type.Integer(),
        code: Type.String(),
      }),
    },
    async handler(req) {
      const { id } = await Roles.findOneByOrFail({ id: req.params.id });
      const permission: string = req.params.code;
      await RolePermissions.softDelete({
        permission: permission,
        role: { id },
      });
    },
  });
};

export default plugin;
