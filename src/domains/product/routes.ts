import { repo } from '$src/databases/typeorm';
import { ResponseShape } from '$src/infra/Response';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { Product } from './models/Product';

const Products = repo(Product);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/products',
    schema: {
      tags: ['Product'],
      querystring: ListQueryOptions({
        filterable: [],
        orderable: [
          'name',
          'basicQuantity',
          'category.name',
          'price',
          'isLocked',
        ],
        searchable: [
          'name',
          'basicQuantity',
          'category.name',
          'price',
          'isLocked',
        ],
      }),
    },
    async handler(req, rep) {
      return new TableQueryBuilder(Products, req)
        .relation(() => ({
          category: true,
        }))
        .exec();
    },
  });
};

export default plugin;
