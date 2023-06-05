import { BinProperty } from '$src/domains/warehouse/models/BinProperty';
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
import { BinPropertySchema } from '../schemas/bin-property.schema';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  const BinProperties = repo(BinProperty);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-property::list'],
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
      return new TableQueryBuilder(BinProperties, req).exec();
    },
  });

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-property::list'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await BinProperties.findOneByOrFail({ id: req.params.id });
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-property::create'],
        },
      ],
      body: Type.Pick(BinPropertySchema, ['title']),
    },
    async handler(req) {
      return await BinProperties.save({
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
          OAuth2: ['warehouse@bin-property::update'],
        },
      ],
      body: Type.Pick(BinPropertySchema, ['title']),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await BinProperties.findOneByOrFail({ id: req.params.id });
      await BinProperties.update({ id }, req.body);
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-property::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const property = await BinProperties.findOneByOrFail({
        id: req.params.id,
      });
      await BinProperties.softRemove(property);
    },
  });
};

export default plugin;
