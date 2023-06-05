import { allDocumentTypes } from '$src/domains/customer/statics/documentTypes';
import { allSubscriberTypes } from '$src/domains/customer/statics/subscriberTypes';
import { ResponseShape } from '$src/infra/Response';
import Docs from '$src/infra/docs';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { join } from 'node:path';
import { Nationality } from '../models/Nationality';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  await app.register(Docs, {
    path: join(__dirname, './docs.md'),
  });

  await app.register(import('./customers'), { prefix: '/customers' });

  const Nationalities = repo(Nationality);

  app.route({
    method: 'GET',
    url: '/nationalities',
    schema: {
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt', 'title']),
        filter: Filter({
          title: Searchable(),
        }),
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Nationalities, req).exec();
    },
  });
  app.route({
    method: 'GET',
    url: '/subscriber-types',
    async handler() {
      return allSubscriberTypes;
    },
  });
  app.route({
    method: 'GET',
    url: '/document-types',
    async handler() {
      return allDocumentTypes;
    },
  });
};

export default plugin;
