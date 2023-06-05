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
import { Language } from '../models/Language';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  const Languages = repo(Language);

  await app.register(import('./suppliers'), { prefix: '/suppliers' });

  app.route({
    method: 'GET',
    url: '/languages',
    schema: {
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt', 'title']),
        filter: Filter({
          title: Searchable(),
        }),
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Languages, req).exec();
    },
  });
};

export default plugin;
