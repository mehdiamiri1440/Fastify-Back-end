import { TagSchema } from '$src/domains/configuration/schemas/tag.schema';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Tag } from '../models/Tag';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Tags = repo(Tag);

  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['configuration@tag::list'],
        },
      ],
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt', 'name']),
        filter: Filter({
          name: Searchable(),
        }),
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Tags, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['configuration@tag::create'],
        },
      ],
      body: Type.Pick(TagSchema, ['name']),
    },
    async handler(req) {
      return await Tags.save({
        ...req.body,
        creator: { id: req.user.id },
      });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['configuration@tag::update'],
        },
      ],
      body: Type.Pick(TagSchema, ['name']),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await Tags.findOneByOrFail({ id: req.params.id });
      await Tags.update({ id }, req.body);
    },
  });
};

export default plugin;
