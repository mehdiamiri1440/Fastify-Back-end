import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Product } from '../models/Product';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const Products = repo(Product);

  // GET /products/:id/histories
  app.route({
    method: 'GET',
    url: '/products/:id/bins',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['product@product-bins::list'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      const { unit, binProducts, size } = await Products.findOneOrFail({
        where: { id },
        relations: {
          binProducts: {
            bin: {
              warehouse: true,
            },
          },
          unit: true,
          size: true,
        },
        select: {
          id: true,
          binProducts: {
            id: true,
            quantity: true,
            bin: {
              id: true,
              name: true,
              internalCode: true,
              warehouse: {
                id: true,
                name: true,
              },
            },
          },
          unit: {
            id: true,
            name: true,
          },
        },
      });

      return binProducts.map((binProduct) => ({
        ...binProduct,
        unit,
        size,
      }));
    },
  });
};

export default plugin;
