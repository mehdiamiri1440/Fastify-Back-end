import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Warehouse } from '../models/Warehouse';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
const Warehouses = repo(Warehouse);
import { Type } from '@sinclair/typebox';
import { WarehouseSchema } from '../schemas/warehouse.schema';

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
        filterable: ['name', 'province', 'city', 'street', 'postalCode'],
        orderable: ['name', 'province', 'city', 'street', 'postalCode'],
        searchable: ['name', 'province', 'city', 'street', 'postalCode'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Warehouses, req).exec();
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
