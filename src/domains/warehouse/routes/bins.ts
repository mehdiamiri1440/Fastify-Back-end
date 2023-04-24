import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Bin } from '../models/Bin';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
const Bins = repo(Bin);
import { Type } from '@sinclair/typebox';
import { BinSchema } from '../schemas/bin.schema';
import { Warehouse } from '../models/Warehouse';
import { BinSize } from '$src/domains/warehouse/models/BinSize';
import { BinProperty } from '$src/domains/warehouse/models/BinProperty';
const Warehouses = repo(Warehouse);
const BinSizes = repo(BinSize);
const BinProperties = repo(BinProperty);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin::list'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['name', 'province', 'city', 'street', 'postalCode'],
        orderable: ['name', 'province', 'city', 'street', 'postalCode'],
        searchable: ['name', 'province', 'city', 'street', 'postalCode'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Bins, req).exec();
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin::create'],
        },
      ],
      body: Type.Omit(BinSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      // validating references
      const warehouse = await Warehouses.findOneByOrFail({
        id: req.body.warehouse,
      });
      const size = await BinSizes.findOneByOrFail({ id: req.body.size });
      const property = await BinProperties.findOneByOrFail({
        id: req.body.property,
      });

      return await Bins.save({
        ...req.body,
        warehouse,
        size,
        property,
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
          OAuth2: ['warehouse@bin::update'],
        },
      ],
      body: Type.Omit(BinSchema, [
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
      // validating references
      const warehouse = await Warehouses.findOneByOrFail({
        id: req.body.warehouse,
      });
      const size = await BinSizes.findOneByOrFail({ id: req.body.size });
      const property = await BinProperties.findOneByOrFail({
        id: req.body.property,
      });

      const { id } = await Bins.findOneByOrFail({ id: req.params.id });
      await Bins.update(
        { id },
        {
          ...req.body,
          warehouse,
          size,
          property,
        },
      );
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await Bins.findOneByOrFail({ id: req.params.id });
      await Bins.delete({ id });
    },
  });
};

export default plugin;