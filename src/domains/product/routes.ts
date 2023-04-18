import { repo } from '$src/databases/typeorm';
import { ResponseShape } from '$src/infra/Response';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { Product } from './models/Product';
import { Type } from '@sinclair/typebox';
import { createError } from '@fastify/error';

const PRODUCT_NOT_FOUND = createError(
  'PRODUCT_NOT_FOUND',
  'product not found',
  404,
);

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

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      tags: ['Product'],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const product = await Products.findOneBy({ id: req.params.id });
      if (!product) throw PRODUCT_NOT_FOUND();
      return product;
    },
  });
};

export default plugin;
