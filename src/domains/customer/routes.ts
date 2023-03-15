import { usersAuth } from '$src/authentication/users';
import { repo } from '$src/databases/typeorm';
import { ResponseShape } from '$src/infra/Response';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Nationality as _Nationality } from './models/Nationality';

const Nationality = repo(_Nationality);

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
      return new TableQueryBuilder(Nationality, req).exec();
    },
  });

  app.route({
    method: 'POST',
    url: '/nationalities',
    onRequest: usersAuth,
    schema: {
      body: Type.Object({
        title: Type.String(),
      }),
    },
    async handler(req) {
      const { title } = req.body;
      const { user } = req;

      const entity = await Nationality.save({
        title,
        creator: user,
      });

      return entity;
    },
  });
};

export default plugin;
