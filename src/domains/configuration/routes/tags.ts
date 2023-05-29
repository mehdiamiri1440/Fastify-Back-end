import { TagSchema } from '$src/domains/configuration/schemas/tag.schema';
import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Tag } from '../models/Tag';

const Tags = repo(Tag);
const plugin: FastifyPluginAsyncTypebox = async function (app) {
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
      querystring: ListQueryOptions({
        filterable: ['name'],
        orderable: ['name'],
        searchable: ['name'],
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
