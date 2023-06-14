import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Product } from '../models/Product';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { BinProduct } from '$src/domains/product/models/BinProduct';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const Products = repo(Product);
  const Bins = repo(Bin);
  const BinProducts = repo(BinProduct);

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

      return binProducts
        .filter((binProduct) => binProduct.quantity > 0)
        .map((binProduct) => ({
          ...binProduct,
          unit,
          size,
        }));
    },
  });

  app.route({
    method: 'GET',
    url: '/bins/:id/products',
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
      const { id } = await Bins.findOneByOrFail({ id: req.params.id });

      return BinProducts.find({
        where: { bin: { id } },
        relations: {
          product: { unit: true, images: true },
        },
        order: { id: 'asc' },
      });
    },
  });
};

export default plugin;
