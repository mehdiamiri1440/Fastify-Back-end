import { BinProperty } from '$src/domains/warehouse/models/BinProperty';
import { BinSize } from '$src/domains/warehouse/models/BinSize';
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
import { Bin } from '../models/Bin';
import { Warehouse } from '../models/Warehouse';
import { BinSchema } from '../schemas/bin.schema';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const Bins = repo(Bin);
  const Warehouses = repo(Warehouse);
  const BinSizes = repo(BinSize);
  const BinProperties = repo(BinProperty);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin::list'],
        },
      ],
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'name', 'createdAt']),
        filter: Filter({
          name: Searchable(),
        }),
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Bins, req)
        .relation({ size: true, property: true, warehouse: true })
        .exec();
    },
  });
  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin::list'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await Bins.findOneOrFail({
        where: { id: req.params.id },
        relations: { size: true, property: true, warehouse: true },
      });
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
      body: Type.Pick(BinSchema, [
        'name',
        'warehouse',
        'size',
        'property',
        'physicalCode',
        'internalCode',
        'description',
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
      body: Type.Pick(BinSchema, [
        'name',
        'warehouse',
        'size',
        'property',
        'physicalCode',
        'internalCode',
        'description',
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
      const bin = await Bins.findOneByOrFail({ id: req.params.id });
      await Bins.softRemove(bin);
    },
  });
};

export default plugin;
