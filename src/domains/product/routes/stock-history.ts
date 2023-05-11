import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { ProductImage } from '../models/ProductImage';
import { repo } from '$src/infra/utils/repo';
import { FastifySchema } from 'fastify';
import { Product } from '../models/Product';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { ProductStockHistory } from '../models/ProductStockHistory';
import * as where from '$src/infra/tables/filter';
import {
  ListQueryOptions,
  ListQueryParams,
} from '$src/infra/tables/schema_builder';
import * as order from '$src/infra/tables/order';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const ProductStockHistories = repo(ProductStockHistory);

  // GET /products/:id/histories
  app.route({
    method: 'GET',
    url: '/products/:id/history',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      querystring: ListQueryOptions({
        filterable: ['sourceType'],
        orderable: ['sourceType', 'bin.name'],
        searchable: ['bin.name'],
      }),
      security: [
        {
          OAuth2: ['product@product-history::list'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { orderBy } = req.query as ListQueryParams;

      return new TableQueryBuilder(ProductStockHistories, req)
        .where(() =>
          where.merge([
            where.from(req),
            {
              product: { id },
            },
          ]),
        )
        .relation(() => ({
          creator: true,
          bin: true,
        }))
        .select(() => ({
          creator: {
            id: true,
            fullName: true,
          },
          bin: {
            id: true,
            name: true,
          },
        }))
        .order(() => (orderBy ? order.from(req) : { id: 'DESC' }))
        .exec();
    },
  });
};

export default plugin;
