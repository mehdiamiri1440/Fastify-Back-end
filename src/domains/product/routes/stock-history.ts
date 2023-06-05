import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import * as where from '$src/infra/tables/filter';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { ProductStockHistory, SourceType } from '../models/ProductStockHistory';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const ProductStockHistories = repo(ProductStockHistory);

  app.get('/products/:id/history', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'sourceType', 'bin.name']),
        filter: Filter({
          sourceType: Type.String({ enum: Object.values(SourceType) }),
          bin: Type.Object({
            name: Searchable(),
          }),
        }),
      }),
      security: [
        {
          OAuth2: ['product@product-history::list'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      return new TableQueryBuilder(ProductStockHistories, req)
        .where(
          where.merge([
            where.from(req),
            {
              product: { id },
            },
          ]),
        )
        .relation({
          creator: true,
          bin: true,
        })
        .select({
          creator: {
            id: true,
            fullName: true,
          },
          bin: {
            id: true,
            name: true,
          },
        })
        .exec();
    },
  });
  app.route({
    method: 'GET',
    url: '/bins/:id/history',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'sourceType', 'bin.name']),
        filter: Filter({
          sourceType: Type.String({ enum: Object.values(SourceType) }),
          bin: Type.Object({
            name: Searchable(),
          }),
        }),
      }),
      security: [
        {
          OAuth2: ['product@product-history::list'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      return new TableQueryBuilder(ProductStockHistories, req)
        .where(
          where.merge([
            where.from(req),
            {
              bin: { id },
            },
          ]),
        )
        .relation({
          creator: true,
          product: true,
        })
        .select({
          creator: {
            id: true,
            fullName: true,
          },
          product: {
            id: true,
            name: true,
          },
        })
        .exec();
    },
  });
};

export default plugin;
