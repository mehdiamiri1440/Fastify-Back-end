import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Product } from '../models/Product';
import { Tag } from '$src/domains/configuration/models/Tag';
import { In } from 'typeorm';
import createError from '@fastify/error';

const INVALID_TAG_ID = createError('INVALID_TAG_ID', 'invalid tag id', 400);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const Products = repo(Product);
  const Tags = repo(Tag);

  app.get('/products/:id/content', {
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
      security: [
        {
          OAuth2: ['product@product-content::view'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      return Products.findOneOrFail({
        where: { id },
        select: {
          id: true,
          content: true,
          tags: { id: true, name: true },
        },
        relations: {
          tags: true,
        },
      });
    },
  });

  app.put('/products/:id/content', {
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
      body: Type.Object({
        content: Type.Union([Type.Null(), Type.String()]),
        tagIds: Type.Array(Type.Integer()),
      }),
    },
    async handler({ body, params }) {
      const { content, tagIds } = body;

      const tags = await Tags.findBy({ id: In(tagIds) });

      const notFoundTagIds = tagIds.filter(
        (tagId) => !tags.find((tag) => tag.id === tagId),
      );
      if (notFoundTagIds.length > 0) {
        throw new INVALID_TAG_ID(`tag with id:${notFoundTagIds[0]} not found`);
      }

      const product = await Products.findOneOrFail({
        where: {
          id: params.id,
        },
      });

      product.content = content;
      product.tags = tags;

      await Products.save(product);

      return product;
    },
  });
};

export default plugin;
