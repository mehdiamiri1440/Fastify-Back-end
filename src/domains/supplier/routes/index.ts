import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Language } from '../models/Language';

const Languages = repo(Language);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  await app.register(import('./suppliers'), { prefix: '/suppliers' });

  app.route({
    method: 'GET',
    url: '/languages',
    schema: {
      querystring: ListQueryOptions({
        filterable: ['title'],
        orderable: ['title'],
        searchable: ['title'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Languages, req).exec();
    },
  });
};

export default plugin;
