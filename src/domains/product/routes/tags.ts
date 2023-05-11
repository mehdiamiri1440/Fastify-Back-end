import { Tag } from '$src/domains/configuration/models/Tag';
import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Product } from '../models/Product';
import createError from '@fastify/error';
import { errorCodes } from 'fastify';

const DUPLICATED_TAG = createError('DUPLICATED_TAG', 'Tag already exists');

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const productsRepo = repo(Product);
  const tagsRepo = repo(Tag);

  app.register(ResponseShape);

  // POST /products/:id/sale-prices
  app.route({
    method: 'POST',
    url: '/products/:id/tags',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({ tagId: Type.Number() }),
      security: [
        {
          OAuth2: ['product@product-tags::edit'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const product = await productsRepo.findOneByOrFail({ id });

      const { tagId } = req.body;
      const tag = await tagsRepo.findOneByOrFail({ id: tagId });
      if (product.tags.find((t) => t.id === tag.id)) {
        throw new DUPLICATED_TAG(`Product already has tag with id ${tagId}`);
      }
      product.tags.push(tag);
      await productsRepo.save(product);
    },
  });

  // POST /products/:id/bins
  app.route({
    method: 'DELETE',
    url: '/products/:id/tags/:tagId',
    schema: {
      params: Type.Object({
        id: Type.Number(),
        tagId: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['product@product-tags::edit'],
        },
      ],
    },
    async handler(req) {
      const { id, tagId } = req.params;
      const product = await productsRepo.findOneByOrFail({ id });

      const tag = await tagsRepo.findOneByOrFail({ id: tagId });
      const index = product.tags.findIndex((t) => t.id === tag.id);
      if (index === -1) throw new errorCodes.FST_ERR_NOT_FOUND();

      product.tags.splice(index, 1);
      await productsRepo.save(product);
      return { success: true };
    },
  });
};

export default plugin;
