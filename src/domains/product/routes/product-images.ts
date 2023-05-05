import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { ProductImage } from '../models/ProductImage';
import { repo } from '$src/infra/utils/repo';
import { FastifySchema } from 'fastify';

const ProductImages = repo(ProductImage);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const security = [
    {
      OAuth2: ['product@product-images::edit'],
    },
  ] satisfies FastifySchema['security'];

  // GET /:id
  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security,
    },
    handler(req) {
      const { id } = req.params;
      return ProductImages.findOneOrFail({
        where: {
          id,
        },
      });
    },
  });

  // DELETE /:id
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security,
    },
    async handler(req) {
      const { id } = req.params;

      const image = await ProductImages.findOneOrFail({
        where: {
          id,
        },
      });

      await ProductImages.softRemove(image);

      return image;
    },
  });
};

export default plugin;
