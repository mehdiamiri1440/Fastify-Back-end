import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { usersAuth } from '$src/authentication/users';
import { User } from '../../user/models/User';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { UserSchema, UserType } from '$src/domains/user/schemas/user.schema';
const Users = repo(User);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    onRequest: usersAuth,
    schema: {
      tags: ['users'],
      querystring: ListQueryOptions({
        filterable: ['title'],
        orderable: ['title'],
        searchable: ['title'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Users, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    onRequest: usersAuth,
    schema: {
      tags: ['users'],
      body: UserSchema,
    },
    async handler(req) {
      return await Users.save(req.body as UserType);
    },
  });
};

export default plugin;
