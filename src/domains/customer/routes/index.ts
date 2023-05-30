import { allDocumentTypes } from '$src/domains/customer/statics/documentTypes';
import { allSubscriberTypes } from '$src/domains/customer/statics/subscriberTypes';
import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Nationality } from '../models/Nationality';
import Docs from '$src/infra/docs';
import { join } from 'node:path';

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
      querystring: ListQueryOptions({
        filterable: ['title'],
        orderable: ['title'],
        searchable: ['title'],
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
