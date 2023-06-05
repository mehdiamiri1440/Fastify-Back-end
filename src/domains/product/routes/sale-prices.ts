import { ResponseShape } from '$src/infra/Response';
import { OrderBy, PaginatedQueryString } from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Product } from '../models/Product';
import { ProductSalePrice } from '../models/ProductSalePrice';

const PRODUCT_NOT_FOUND = createError(
  'PRODUCT_NOT_FOUND',
  'product not found',
  404,
);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  const Products = repo(Product);
  const ProductSalePrices = repo(ProductSalePrice);

  // GET /:id/sale-prices
  app.route({
    method: 'GET',
    url: '/products/:id/sale-prices',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt']),
      }),
      security: [
        {
          OAuth2: ['product@product-sale-prices::list'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      return new TableQueryBuilder(ProductSalePrices, req)
        .where({
          product: { id },
        })
        .exec();
    },
  });

  // POST /products/:id/sale-prices
  app.route({
    method: 'POST',
    url: '/products/:id/sale-prices',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({ price: Type.Number() }),
      security: [
        {
          OAuth2: ['product@product-sale-prices::create'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      const product = await Products.findOneBy({ id });
      if (!product) throw new PRODUCT_NOT_FOUND();

      return ProductSalePrices.save({ product, price: req.body.price });
    },
  });
};

export default plugin;
