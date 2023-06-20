import { User } from '$src/domains/user/models/User';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Range,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Warehouse } from '../models/Warehouse';
import { WarehouseSchema } from '../schemas/warehouse.schema';
import { toTypeOrmFilter } from '$src/infra/tables/filter';
import { toUpperCase } from '$src/infra/tables/order';
import { PaginatedResponse } from '$src/infra/tables/response';
import { AddressSchema } from '$src/domains/geo/address.schema';
import { WarehouseStaff } from '$src/domains/warehouse/models/WarehouseStaff';
import AppDataSource from '$src/DataSource';

const Warehouses = repo(Warehouse);
const Users = repo(User);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::list'],
        },
      ],
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'name', 'supervisor.fullName', 'createdAt']),
        filter: Filter({
          name: Searchable(),
          streetName: Searchable(),
          supervisor: Type.Object({
            fullName: Searchable(),
          }),
          createdAt: Range(Type.String({ format: 'date-time' })),
        }),
      }),
    },
    async handler(req) {
      const { page, pageSize, filter, order, orderBy } = req.query;

      const { streetName, ...normalFilters } = filter ?? {};

      const qb = Warehouses.createQueryBuilder('warehouse')
        .leftJoinAndSelect('warehouse.supervisor', 'supervisor')
        .leftJoinAndSelect('warehouse.creator', 'creator')
        .where(toTypeOrmFilter(normalFilters));

      if (streetName) {
        qb.andWhere(`(warehouse.address ->> 'streetName') ilike :streetName`, {
          streetName: streetName.$like,
        });
      }

      const [rows, total] = await qb
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(`warehouse.${orderBy}`, toUpperCase(order))
        .getManyAndCount();

      return new PaginatedResponse(rows, {
        page: page,
        pageSize: pageSize,
        total,
      });
    },
  });

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
      security: [
        {
          OAuth2: ['warehouse@warehouse::list'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      return Warehouses.findOneOrFail({
        where: {
          id,
        },
        relations: {
          supervisor: true,
          creator: true,
        },
      });
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::create'],
        },
      ],
      body: Type.Pick(WarehouseSchema, [
        'name',
        'description',
        'supervisor',
        'address',
      ]),
    },
    async handler(req) {
      return AppDataSource.transaction(async (manager) => {
        // validate references
        const supervisor = await manager.getRepository(User).findOneByOrFail({
          id: req.body.supervisor,
        });

        const warehouse = await manager.getRepository(Warehouse).save({
          ...req.body,
          supervisor,
          creator: { id: req.user.id },
        });
        await manager.getRepository(WarehouseStaff).save({
          type: 'supervisor',
          user: supervisor,
          warehouse,
          creator: { id: req.user.id },
        });
        return warehouse;
      });
    },
  });

  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::update'],
        },
      ],
      body: Type.Pick(WarehouseSchema, [
        'name',
        'description',
        'supervisor',
        'address',
      ]),
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      return AppDataSource.transaction(async (manager) => {
        // validate references
        const { id } = await manager
          .getRepository(Warehouse)
          .findOneByOrFail({ id: req.params.id });
        const supervisor = await manager.getRepository(User).findOneByOrFail({
          id: req.body.supervisor,
        });
        await manager.getRepository(WarehouseStaff).update(
          {
            type: 'supervisor',
            warehouse: { id },
          },
          {
            user: supervisor,
          },
        );

        await manager
          .getRepository(Warehouse)
          .update({ id }, { ...req.body, supervisor });
      });
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const warehouse = await Warehouses.findOneByOrFail({ id: req.params.id });
      await Warehouses.softRemove(warehouse);
    },
  });
  await app.register(import('./staffs'));
};

export default plugin;
