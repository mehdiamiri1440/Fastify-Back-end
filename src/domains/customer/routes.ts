import { usersAuth } from '$src/authentication/users';
import { repo } from '$src/databases/typeorm';
import { ResponseShape } from '$src/infra/Response';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Nationality } from './models/Nationality';

const Nationalities = repo(Nationality);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/nationalities',
    onRequest: usersAuth,
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
};

export default plugin;
