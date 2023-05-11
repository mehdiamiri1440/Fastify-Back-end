import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Warehouse } from '../models/Warehouse';
import { repo } from '$src/infra/utils/repo';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { Type } from '@sinclair/typebox';
import { WarehouseSchema } from '../schemas/warehouse.schema';

const Warehouses = repo(Warehouse);

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
      querystring: ListQueryOptions({
        filterable: ['province', 'city', 'street', 'postalCode'],
        orderable: ['name', 'province', 'city', 'street', 'postalCode'],
        searchable: ['name', 'province', 'city', 'street', 'postalCode'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Warehouses, req)
        .relation(() => ({ creator: true }))
        .exec();
    },
  });

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      params: Type.Object({
        id: Type.Number(),
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
      return await Warehouses.save(req.body);
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
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await Warehouses.findOneByOrFail({ id: req.params.id });
      await Warehouses.update({ id }, req.body);
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
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await Warehouses.findOneByOrFail({ id: req.params.id });
      await Warehouses.delete({ id });
    },
  });
};

export default plugin;
