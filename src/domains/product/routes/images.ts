import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { ProductImage } from '../models/ProductImage';
import { repo } from '$src/infra/utils/repo';
import { FastifySchema } from 'fastify';
import { Product } from '../models/Product';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  const Products = repo(Product);
  const ProductImages = repo(ProductImage);

  const security = [
    {
      OAuth2: ['product@product-images::edit'],
    },
  ] satisfies FastifySchema['security'];

  // POST /products/:id/images
  app.route({
    method: 'POST',
    url: '/products/:productId/images',
    schema: {
      params: Type.Object({
        productId: Type.Number(),
      }),
      body: Type.Object({
        fileId: Type.String(),
      }),
      security,
    },
    async handler(req) {
      const { productId } = req.params;
      const { fileId } = req.body;
      const inbound = await Products.findOneByOrFail({ id: productId });
      return ProductImages.save({
        inbound,
        fileId,
        creator: {
          id: req.user.id,
        },
      });
    },
  });

  // DELETE /products/:productId/images/:imageId
  app.route({
    method: 'DELETE',
    url: '/products/:productId/images/:imageId',
    schema: {
      params: Type.Object({
        productId: Type.Number(),
        imageId: Type.Number(),
      }),
      security,
    },
    async handler(req) {
      const { imageId, productId } = req.params;

      const image = await ProductImages.findOneOrFail({
        where: {
          id: imageId,
          product: {
            id: productId,
          },
        },
      });

      await ProductImages.softRemove(image);

      return image;
    },
  });
};

export default plugin;
