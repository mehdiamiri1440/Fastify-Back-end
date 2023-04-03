import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { usersAuth } from '$src/authentication/users';
import { Type } from '@sinclair/typebox';
import { User } from '../../user/models/User';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
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
      body: Type.Object({
        firstName: Type.String(),
        lastName: Type.String(),
        // roleId: Type.Number(),
        nif: Type.Number(),
        email: Type.String(),
        phoneNumber: Type.String(),
        password: Type.String(),
        position: Type.String(),
        isActive: Type.Boolean(),
      }),
    },
    async handler(req) {
      const {
        firstName,
        lastName,
        // roleId,
        nif,
        email,
        phoneNumber,
        password,
        position,
        isActive,
      } = req.body;

      const entity = await Users.save({
        firstName: firstName,
        lastName: lastName,
        // role: { id: roleId },
        nif: nif,
        email: email,
        phoneNumber: phoneNumber,
        password: password,
        position: position,
        isActive: isActive,
      });

      return entity;
    },
  });
};

export default plugin;
