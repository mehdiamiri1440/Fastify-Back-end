import { repo } from '$src/infra/utils/repo';
import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Nationality } from '../models/Nationality';
import {
  normalSubscriberTypes,
  businessSubscriberTypes,
} from '$src/domains/customer/statics/subscriberTypes';
import { allDocumentTypes } from '$src/domains/customer/statics/documentTypes';
const Nationalities = repo(Nationality);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
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
  await app.register(import('./customers'), { prefix: '/customers' });
  app.route({
    method: 'GET',
    url: '/subscriber-types',
    async handler() {
      return { normalSubscriberTypes, businessSubscriberTypes };
    },
  });
  app.route({
    method: 'GET',
    url: '/document-types',
    async handler() {
      return { allDocumentTypes };
    },
  });
};

export default plugin;
