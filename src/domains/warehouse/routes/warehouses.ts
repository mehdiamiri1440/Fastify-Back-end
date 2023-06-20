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
      body: Type.Omit(WarehouseSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      // validate references
      const supervisor = await Users.findOneByOrFail({
        id: req.body.supervisor,
      });

      return await Warehouses.save({
        ...req.body,
        supervisor,
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
          OAuth2: ['warehouse@warehouse::update'],
        },
      ],
      body: Type.Omit(WarehouseSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      // validate references
      const { id } = await Warehouses.findOneByOrFail({ id: req.params.id });
      const supervisor = await Users.findOneByOrFail({
        id: req.body.supervisor,
      });

      await Warehouses.update({ id }, { ...req.body, supervisor });
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
